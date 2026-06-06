"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FAB as Fab } from "@/components/shared/fab";
import { formatARS, getMonthDate, getInitials } from "@/lib/utils";
import { effectiveFixedAmount } from "@/lib/utils/balance";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useExpenseSave, type Tab } from "@/lib/queries/use-expense-save";
import {
  updateFixedExpenseInstanceAmount,
  toggleFixedExpenseInstance,
  confirmAllFixedExpenseInstances,
} from "@/lib/actions/expenses";
import { CuotaItem } from "./_components/cuota-item";
import { FijoItem } from "./_components/fijo-item";
import { VariableItem } from "./_components/variable-item";
import { TAB_LABEL, TAB_TESTID } from "./_components/segmented-control";
import { AddSheet } from "./_components/add-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  cuotas: "Compras en cuotas o planes de pago recurrentes",
  fijos: "Agua, luz, expensas y servicios que se repiten cada mes",
  variables: "Gastos puntuales del mes, compartidos o personales",
};

// ── FLOW STATE ────────────────────────────────────────────────────────────────

type FlowState =
  | { step: "idle" }
  | { step: "type-selector" }
  | { step: "service-list" }
  | { step: "edit-service"; instanceId: string }
  | { step: "new-service" }
  | { step: "cuota-form" }
  | { step: "compra-form" };

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function TabDescription({ tab }: { tab: Tab }) {
  return (
    <p
      data-testid="tab-description"
      style={{
        margin: "6px 20px 0",
        fontSize: 12,
        lineHeight: 1.4,
        color: "var(--fg-2)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {TAB_DESCRIPTIONS[tab]}
    </p>
  );
}

// ── TYPE SELECTOR SHEET ──────────────────────────────────────────────────────

interface TypeSelectorSheetProps {
  readonly onSelectServicio: () => void;
  readonly onSelectCuota: () => void;
  readonly onSelectCompra: () => void;
  readonly onClose: () => void;
}

function TypeSelectorSheet({
  onSelectServicio,
  onSelectCuota,
  onSelectCompra,
  onClose,
}: TypeSelectorSheetProps) {
  const options: Array<{
    label: string;
    description: string;
    icon: string;
    testId: string;
    onSelect: () => void;
  }> = [
    {
      label: "Servicio",
      description: "Agua, luz, expensas y servicios que se repiten cada mes",
      icon: "🏠",
      testId: "type-option-servicio",
      onSelect: onSelectServicio,
    },
    {
      label: "Cuota",
      description: "Compra en cuotas, ¿en qué tarjeta?",
      icon: "💳",
      testId: "type-option-cuota",
      onSelect: onSelectCuota,
    },
    {
      label: "Compra",
      description: "Super, verdulería, gastos puntuales",
      icon: "🛒",
      testId: "type-option-compra",
      onSelect: onSelectCompra,
    },
  ];

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        data-testid="type-selector-sheet"
        side="bottom"
        showCloseButton={false}
        style={{
          maxWidth: 390,
          margin: "0 auto",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px max(56px, env(safe-area-inset-bottom, 56px))",
          background: "var(--bg-elevated)",
          border: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: "var(--border-default)",
            margin: "0 auto 20px",
          }}
        />
        <SheetHeader style={{ marginBottom: 20 }}>
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            ¿Qué querés agregar?
          </SheetTitle>
        </SheetHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map((opt) => (
            <button
              key={opt.label}
              data-testid={opt.testId}
              onClick={opt.onSelect}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--bg-sunken)",
                border: "1.5px solid var(--border-subtle)",
                borderRadius: 16,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-3)",
                    marginTop: 2,
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.4,
                  }}
                >
                  {opt.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── SERVICE LIST SHEET ────────────────────────────────────────────────────────

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

interface ServiceListSheetProps {
  readonly instances: readonly FixedExpenseInstance[];
  readonly onPickInstance: (id: string) => void;
  readonly onCreateNew: () => void;
  readonly onClose: () => void;
}

function ServiceListSheet({
  instances,
  onPickInstance,
  onCreateNew,
  onClose,
}: ServiceListSheetProps) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        data-testid="service-list-sheet"
        side="bottom"
        showCloseButton={false}
        style={{
          maxWidth: 390,
          margin: "0 auto",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 40px",
          background: "var(--bg-elevated)",
          border: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: "var(--border-default)",
            margin: "0 auto 20px",
          }}
        />
        <SheetHeader style={{ marginBottom: 16 }}>
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Servicios del mes
          </SheetTitle>
        </SheetHeader>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            background: "var(--bg-sunken)",
            borderRadius: 14,
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
          }}
        >
          {instances.length === 0 && (
            <div
              style={{
                padding: "20px 16px",
                fontSize: 13,
                color: "var(--fg-3)",
                fontFamily: "var(--font-sans)",
                textAlign: "center",
              }}
            >
              Sin servicios este mes
            </div>
          )}
          {instances.map((fi) => {
            const amount = effectiveFixedAmount(fi);
            return (
              <button
                key={fi.id}
                onClick={() => onPickInstance(fi.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  border: "none",
                  borderBottom: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--fg-1)",
                      fontFamily: "var(--font-sans)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fi.fixed_expense_templates.description}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--fg-3)",
                      fontFamily: "var(--font-mono)",
                      marginTop: 2,
                    }}
                  >
                    {formatARS(amount)}
                  </div>
                </div>
                {fi.paid && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-teal)",
                      background:
                        "color-mix(in srgb, var(--color-teal) 12%, transparent)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontFamily: "var(--font-sans)",
                      flexShrink: 0,
                    }}
                  >
                    ✓ Pagado
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCreateNew}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
            width: "100%",
            padding: "13px 16px",
            background: "transparent",
            border: "1.5px dashed var(--border-default)",
            borderRadius: 14,
            color: "var(--accent)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          + Nuevo servicio
        </button>
      </SheetContent>
    </Sheet>
  );
}

// ── EDIT SERVICE SHEET ─────────────────────────────────────────────────────────

interface EditServiceSheetProps {
  readonly instance: FixedExpenseInstance;
  readonly coupleId: string;
  readonly month: string;
  readonly onClose: () => void;
}

function EditServiceSheet({
  instance,
  coupleId,
  month,
  onClose,
}: EditServiceSheetProps) {
  const queryClient = useQueryClient();
  const currentAmount = effectiveFixedAmount(instance);
  const [draft, setDraft] = useState(String(currentAmount));
  const [fieldError, setFieldError] = useState<string | null>(null);

  const amountMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number | null }) =>
      updateFixedExpenseInstanceAmount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-data", coupleId, month],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      toggleFixedExpenseInstance(id, paid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-data", coupleId, month],
      });
    },
  });

  function handleSave() {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFieldError("El monto debe ser mayor a cero");
      return;
    }
    setFieldError(null);
    amountMutation.mutate(
      { id: instance.id, amount: parsed },
      { onSuccess: onClose },
    );
  }

  const isPending = amountMutation.isPending || toggleMutation.isPending;
  const name = instance.fixed_expense_templates.description;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        data-testid="edit-service-sheet"
        side="bottom"
        showCloseButton={false}
        style={{
          maxWidth: 390,
          margin: "0 auto",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 40px",
          background: "var(--bg-elevated)",
          border: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: "var(--border-default)",
            margin: "0 auto 20px",
          }}
        />
        <SheetHeader style={{ marginBottom: 16 }}>
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {name}
          </SheetTitle>
        </SheetHeader>

        {/* Amount edit */}
        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="edit-service-amount"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg-2)",
              marginBottom: 5,
              fontFamily: "var(--font-sans)",
            }}
          >
            Monto este mes
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-sunken)",
              borderRadius: 10,
              border: "1.5px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <span
              aria-hidden
              style={{
                padding: "10px 6px 10px 12px",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--fg-3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              $
            </span>
            <input
              id="edit-service-amount"
              type="number"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setFieldError(null);
              }}
              inputMode="numeric"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                padding: "10px 12px 10px 4px",
                fontSize: 16,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                outline: "none",
                color: "var(--fg-1)",
              }}
            />
          </div>
          {instance.amount_override == null && (
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-3)",
                marginTop: 4,
                fontFamily: "var(--font-sans)",
              }}
            >
              Default: {formatARS(instance.fixed_expense_templates.amount)}
            </div>
          )}
          {fieldError && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color: "var(--status-danger)",
                marginTop: 4,
                fontFamily: "var(--font-sans)",
              }}
            >
              {fieldError}
            </div>
          )}
        </div>

        {/* Paid toggle */}
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Ya lo pagué
          </span>
          <button
            type="button"
            onClick={() =>
              toggleMutation.mutate({ id: instance.id, paid: !instance.paid })
            }
            disabled={isPending}
            style={{
              width: 44,
              height: 26,
              borderRadius: 99,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              background: instance.paid
                ? "var(--accent)"
                : "var(--border-default)",
              transition: "background 150ms",
              position: "relative",
              opacity: isPending ? 0.6 : 1,
            }}
            aria-label="Ya lo pagué"
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 99,
                background: "white",
                position: "absolute",
                top: 3,
                left: instance.paid ? 21 : 3,
                transition: "left 150ms",
              }}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            width: "100%",
            padding: "13px 16px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          Guardar
        </button>
      </SheetContent>
    </Sheet>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("cuotas");
  const [flow, setFlow] = useState<FlowState>({ step: "idle" });
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { save, saveError } = useExpenseSave(tab);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setFilterCategory(null);
  }

  const { data: member } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;
  const month = getMonthDate();
  const { data } = useMonthlyData(coupleId, month);
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: categories = [] } = useCategories(coupleId);

  const getPersonInitials = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? getInitials(p.full_name) : "?";
  };
  const getPerson = (userId: string): "a" | "b" =>
    userId === member?.user_id ? "a" : "b";

  function handleSave(
    fields: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
    requiresMonthlyReview: boolean,
  ) {
    setFlow({ step: "idle" });
    save(fields, categoryId, autoRenew, requiresMonthlyReview);
  }

  const queryClient = useQueryClient();

  const confirmAllMutation = useMutation({
    mutationFn: () =>
      confirmAllFixedExpenseInstances(coupleId!, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    },
  });

  const allCuotas = data?.installmentPurchases ?? [];
  const allFijos = data?.fixedExpenseInstances ?? [];
  const allVariables = data?.variableExpenses ?? [];

  const pendingFijosCount = allFijos.filter(
    (fi) => fi.status === "PENDING_CONFIRMATION",
  ).length;

  const cuotas = filterCategory
    ? allCuotas.filter((c) => c.category_id === filterCategory)
    : allCuotas;
  const fijos = filterCategory
    ? allFijos.filter(
        (fi) => fi.fixed_expense_templates?.category_id === filterCategory,
      )
    : allFijos;
  const variables = filterCategory
    ? allVariables.filter((v) => v.category_id === filterCategory)
    : allVariables;

  // Resolve the active fixed instance for edit-service step
  const activeInstance =
    flow.step === "edit-service"
      ? (allFijos.find((fi) => fi.id === flow.instanceId) ?? null)
      : null;

  // Map flow steps to AddSheet tab
  const addSheetTab: Tab | null =
    flow.step === "cuota-form"
      ? "cuotas"
      : flow.step === "new-service"
        ? "fijos"
        : flow.step === "compra-form"
          ? "variables"
          : null;

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--bg-base)",
      }}
    >
      <Tabs
        value={tab}
        onValueChange={(v) => handleTabChange(v as Tab)}
        className="flex flex-1 flex-col"
      >
        <div
          style={{
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
            paddingTop: 14,
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              padding: "0 20px 10px",
              margin: 0,
            }}
          >
            Gastos
          </h1>
          <div style={{ padding: "0 16px 10px" }}>
            <TabsList className="w-full bg-(--bg-sunken)">
              {(["cuotas", "fijos", "variables"] as Tab[]).map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  data-testid={TAB_TESTID[t]}
                  className="flex-1 text-(--fg-2) data-[state=active]:bg-(--bg-elevated) data-[state=active]:font-semibold data-[state=active]:text-(--accent) data-[state=active]:shadow-sm"
                >
                  {TAB_LABEL[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabDescription tab={tab} />
          {categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                padding: "8px 16px 10px",
                scrollbarWidth: "none",
              }}
            >
              <button
                onClick={() => setFilterCategory(null)}
                style={{
                  flexShrink: 0,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "1px solid var(--border-subtle)",
                  background:
                    filterCategory === null
                      ? "var(--accent)"
                      : "var(--bg-sunken)",
                  color: filterCategory === null ? "#fff" : "var(--fg-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                }}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setFilterCategory(filterCategory === cat.id ? null : cat.id)
                  }
                  style={{
                    flexShrink: 0,
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: "1px solid var(--border-subtle)",
                    background:
                      filterCategory === cat.id
                        ? "var(--accent)"
                        : "var(--bg-sunken)",
                    color: filterCategory === cat.id ? "#fff" : "var(--fg-2)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* CUOTAS */}
          <TabsContent value="cuotas" className="mt-0">
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {cuotas.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                  }}
                >
                  Sin compras en cuotas. Usá el + para agregar.
                </div>
              )}
              {cuotas.map((c) => (
                <CuotaItem key={c.id} c={c} />
              ))}
            </div>
          </TabsContent>

          {/* FIJOS */}
          <TabsContent value="fijos" className="mt-0">
            <div style={{ padding: "12px 16px" }}>
              {fijos.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                  }}
                >
                  Sin gastos fijos. Usá el + para agregar.
                </div>
              )}
              {fijos.length > 0 && (
                <>
                  {pendingFijosCount > 0 && coupleId && (
                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        data-testid="confirm-all-fijos"
                        onClick={() => confirmAllMutation.mutate()}
                        disabled={confirmAllMutation.isPending}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1.5px solid var(--color-coral)`,
                          background:
                            "color-mix(in srgb, var(--color-coral) 10%, transparent)",
                          color: "var(--color-coral)",
                          cursor: confirmAllMutation.isPending
                            ? "not-allowed"
                            : "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "var(--font-sans)",
                          opacity: confirmAllMutation.isPending ? 0.5 : 1,
                        }}
                      >
                        Confirmar todos
                      </button>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      background: "var(--bg-elevated)",
                      borderRadius: 14,
                      border: "1px solid var(--border-subtle)",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {fijos.map((fi, i) => (
                      <FijoItem
                        key={fi.id}
                        fi={fi}
                        isLast={i === fijos.length - 1}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      background: "var(--bg-elevated)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--fg-2)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Total servicios
                    </span>
                    <span
                      data-testid="fijos-total"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--fg-1)",
                      }}
                    >
                      {formatARS(
                        fijos.reduce(
                          (s, fi) => s + effectiveFixedAmount(fi),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* VARIABLES */}
          <TabsContent value="variables" className="mt-0">
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {variables.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                  }}
                >
                  Sin gastos variables. Usá el + para agregar.
                </div>
              )}
              {variables.map((v) => (
                <VariableItem
                  key={v.id}
                  v={v}
                  getPersonInitials={getPersonInitials}
                  getPerson={getPerson}
                />
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {flow.step === "idle" && (
        <Fab
          onClick={() => setFlow({ step: "type-selector" })}
          label="Agregar gasto"
        />
      )}

      {/* TYPE SELECTOR */}
      {flow.step === "type-selector" && (
        <TypeSelectorSheet
          onSelectServicio={() => setFlow({ step: "service-list" })}
          onSelectCuota={() => setFlow({ step: "cuota-form" })}
          onSelectCompra={() => setFlow({ step: "compra-form" })}
          onClose={() => setFlow({ step: "idle" })}
        />
      )}

      {/* SERVICE LIST */}
      {flow.step === "service-list" && (
        <ServiceListSheet
          instances={allFijos}
          onPickInstance={(id) =>
            setFlow({ step: "edit-service", instanceId: id })
          }
          onCreateNew={() => setFlow({ step: "new-service" })}
          onClose={() => setFlow({ step: "idle" })}
        />
      )}

      {/* EDIT SERVICE */}
      {flow.step === "edit-service" && activeInstance && coupleId && (
        <EditServiceSheet
          instance={activeInstance}
          coupleId={coupleId}
          month={month}
          onClose={() => setFlow({ step: "idle" })}
        />
      )}

      {/* CUOTA / NEW-SERVICE / COMPRA FORMS — reuse AddSheet with correct tab */}
      {addSheetTab !== null && (
        <AddSheet
          tab={addSheetTab}
          categories={categories}
          onClose={() => setFlow({ step: "idle" })}
          onSave={handleSave}
          saveError={saveError}
        />
      )}
    </main>
  );
}
