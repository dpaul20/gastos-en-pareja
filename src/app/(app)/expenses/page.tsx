"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FAB as Fab } from "@/components/shared/fab";
import { formatARS, getMonthDate, getInitials, cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
      className="text-xs"
      style={{
        margin: "6px 20px 0",
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
        aria-describedby={undefined}
        className="mx-auto w-full sm:max-w-120 rounded-t-[20px] pb-safe-mobile"
        style={{
          background: "var(--bg-elevated)",
          border: "none",
          padding: "20px 20px 0",
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
        <SheetHeader className="mb-5">
          <SheetTitle
            className="text-lg font-bold"
            style={{
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            ¿Qué querés agregar?
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-[10px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              data-testid={opt.testId}
              onClick={opt.onSelect}
              className="flex items-center w-full text-left cursor-pointer rounded-2xl px-4 py-[14px] gap-[14px]"
              style={{
                background: "var(--bg-sunken)",
                border: "1.5px solid var(--border-subtle)",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 28 }}>{opt.icon}</span>
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  className="text-xs"
                  style={{
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
        aria-describedby={undefined}
        className="mx-auto w-full sm:max-w-120 rounded-t-[20px]"
        style={{
          background: "var(--bg-elevated)",
          border: "none",
          padding: "20px 20px 40px",
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
        <SheetHeader className="mb-4">
          <SheetTitle
            className="text-lg font-bold"
            style={{
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Servicios del mes
          </SheetTitle>
        </SheetHeader>

        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            gap: 1,
            background: "var(--bg-sunken)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {instances.length === 0 && (
            <div
              className="text-[13px] text-center"
              style={{
                padding: "20px 16px",
                color: "var(--fg-3)",
                fontFamily: "var(--font-sans)",
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
                className="flex items-center justify-between gap-3 px-4 py-3 w-full text-left cursor-pointer"
                style={{
                  background: "var(--bg-elevated)",
                  border: "none",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="text-sm font-medium"
                    style={{
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
                    className="text-xs"
                    style={{
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
                    className="text-xs font-semibold flex-shrink-0 rounded-[6px] px-2 py-[2px]"
                    style={{
                      color: "var(--color-teal)",
                      background:
                        "color-mix(in srgb, var(--color-teal) 12%, transparent)",
                      fontFamily: "var(--font-sans)",
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
          className="flex items-center justify-center gap-2 mt-3 w-full text-sm font-semibold rounded-2xl cursor-pointer"
          style={{
            padding: "13px 16px",
            background: "transparent",
            border: "1.5px dashed var(--border-default)",
            color: "var(--accent)",
            fontFamily: "var(--font-sans)",
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
        aria-describedby={undefined}
        className="mx-auto w-full sm:max-w-120 rounded-t-[20px]"
        style={{
          background: "var(--bg-elevated)",
          border: "none",
          padding: "20px 20px 40px",
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
        <SheetHeader className="mb-4">
          <SheetTitle
            className="text-lg font-bold"
            style={{
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {name}
          </SheetTitle>
        </SheetHeader>

        {/* Amount edit */}
        <div className="mb-[14px]">
          <label
            htmlFor="edit-service-amount"
            className="block text-[13px] font-medium mb-[5px]"
            style={{
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Monto este mes
          </label>
          <div
            className="flex items-center overflow-hidden"
            style={{
              background: "var(--bg-sunken)",
              borderRadius: 10,
              border: "1.5px solid var(--border-default)",
            }}
          >
            <span
              aria-hidden
              className="text-base font-semibold"
              style={{
                padding: "10px 6px 10px 12px",
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
              className="flex-1 text-base font-semibold"
              style={{
                border: "none",
                background: "transparent",
                padding: "10px 12px 10px 4px",
                fontFamily: "var(--font-mono)",
                outline: "none",
                color: "var(--fg-1)",
              }}
            />
          </div>
          {instance.amount_override == null && (
            <div
              className="text-xs mt-1"
              style={{
                color: "var(--fg-3)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Default: {formatARS(instance.fixed_expense_templates.amount)}
            </div>
          )}
          {fieldError && (
            <div
              role="alert"
              className="text-xs mt-1"
              style={{
                color: "var(--status-danger)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {fieldError}
            </div>
          )}
        </div>

        {/* Paid toggle */}
        <div className="mb-5 flex items-center justify-between">
          <span
            className="text-[13px] font-medium"
            style={{
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Ya lo pagué
          </span>
          <Switch
            checked={instance.paid}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ id: instance.id, paid: checked })
            }
            disabled={isPending}
            aria-label={instance.paid ? "Marcar como no pagado" : "Marcar como pagado"}
          />
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full"
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          Guardar
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("cuotas");
  const [flow, setFlow] = useState<FlowState>({ step: "idle" });
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Map flow steps to AddSheet tab — must be computed before useExpenseSave
  const addSheetTab: Tab | null =
    flow.step === "cuota-form"
      ? "cuotas"
      : flow.step === "new-service"
        ? "fijos"
        : flow.step === "compra-form"
          ? "variables"
          : null;

  const { save, saveError } = useExpenseSave(addSheetTab ?? tab);

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
    isShared: boolean,
    payerId?: string | null,
  ) {
    setFlow({ step: "idle" });
    save(fields, categoryId, autoRenew, requiresMonthlyReview, isShared, payerId);
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

  return (
    <main
      className="flex flex-col"
      style={{
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
            className="text-lg font-bold px-5 pb-[10px] m-0"
            style={{
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Gastos
          </h1>
          <div className="px-4 pb-2.5">
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
            <div className="flex overflow-x-auto gap-1.5 px-4 pt-2 pb-2.5 [scrollbar-width:none]">
              <button
                onClick={() => setFilterCategory(null)}
                className="flex-shrink-0 text-xs font-semibold cursor-pointer rounded-[20px]"
                style={{
                  padding: "4px 12px",
                  border: "1px solid var(--border-subtle)",
                  background:
                    filterCategory === null
                      ? "var(--accent)"
                      : "var(--bg-sunken)",
                  color: filterCategory === null ? "#fff" : "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
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
                  className="flex-shrink-0 text-xs font-semibold cursor-pointer rounded-[20px]"
                  style={{
                    padding: "4px 12px",
                    border: "1px solid var(--border-subtle)",
                    background:
                      filterCategory === cat.id
                        ? "var(--accent)"
                        : "var(--bg-sunken)",
                    color: filterCategory === cat.id ? "#fff" : "var(--fg-2)",
                    fontFamily: "var(--font-sans)",
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
            <div className="px-4 py-3 flex flex-col gap-2">
              {cuotas.length === 0 && (
                <div
                  className="text-center text-sm py-12"
                  style={{
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Sin compras en cuotas. Usá el + para agregar.
                </div>
              )}
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {cuotas.map((c) => (
                  <li key={c.id}>
                    <CuotaItem
                      c={c}
                      getPersonInitials={getPersonInitials}
                      getPerson={getPerson}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* FIJOS */}
          <TabsContent value="fijos" className="mt-0">
            <div style={{ padding: "12px 16px" }}>
              {fijos.length === 0 && (
                <div
                  className="text-center text-sm"
                  style={{
                    padding: "48px 0",
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Sin gastos fijos. Usá el + para agregar.
                </div>
              )}
              {fijos.length > 0 && (
                <>
                  {pendingFijosCount > 0 && coupleId && (
                    <div className="mb-2 flex justify-end">
                      <Button
                        data-testid="confirm-all-fijos"
                        onClick={() => confirmAllMutation.mutate()}
                        disabled={confirmAllMutation.isPending}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-[13px] font-semibold",
                          confirmAllMutation.isPending && "opacity-50",
                        )}
                        style={{
                          border: `1.5px solid var(--color-coral)`,
                          background:
                            "color-mix(in srgb, var(--color-coral) 10%, transparent)",
                          color: "var(--color-coral)",
                        }}
                      >
                        Confirmar todos
                      </Button>
                    </div>
                  )}
                  <ul
                    className="list-none m-0 p-0 flex flex-col rounded-2xl overflow-hidden"
                    style={{
                      gap: 1,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {fijos.map((fi, i) => (
                      <li key={fi.id}>
                        <FijoItem
                          fi={fi}
                          isLast={i === fijos.length - 1}
                          getPersonInitials={getPersonInitials}
                          getPerson={getPerson}
                        />
                      </li>
                    ))}
                  </ul>
                  <div
                    className="flex justify-between rounded-xl px-4 py-3 mt-2"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        color: "var(--fg-2)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Total servicios
                    </span>
                    <span
                      data-testid="fijos-total"
                      className="text-[15px] font-bold"
                      style={{
                        fontFamily: "var(--font-mono)",
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
            <div className="px-4 py-3 flex flex-col gap-2">
              {variables.length === 0 && (
                <div
                  className="text-center text-sm"
                  style={{
                    padding: "48px 0",
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Sin gastos variables. Usá el + para agregar.
                </div>
              )}
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {variables.map((v) => (
                  <li key={v.id}>
                    <VariableItem
                      v={v}
                      getPersonInitials={getPersonInitials}
                      getPerson={getPerson}
                    />
                  </li>
                ))}
              </ul>
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
          members={profiles}
          currentUserId={member?.user_id ?? undefined}
        />
      )}
    </main>
  );
}
