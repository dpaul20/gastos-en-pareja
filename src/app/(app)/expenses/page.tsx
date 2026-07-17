"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Home,
  CreditCard,
  ShoppingCart,
  Info,
  type LucideIcon,
} from "lucide-react";
import { FAB as Fab } from "@/components/shared/fab";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatARS, getMonthDate, getInitials } from "@/lib/utils";
import { isBilled, billedFixedAmount } from "@/lib/utils/balance";
import { parseAmount } from "@/lib/utils/amount";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useLastBilledAmounts } from "@/lib/queries/use-last-billed";
import { useExpenseSave, type Tab } from "@/lib/queries/use-expense-save";
import {
  updateFixedExpenseInstanceAmount,
  updateFixedExpenseInstanceDueDay,
  toggleFixedExpenseInstance,
  deactivateFixedExpenseTemplate,
  reactivateFixedExpenseTemplate,
  updateFixedExpenseTemplate,
  markFixedExpenseInstanceAwaitingBill,
} from "@/lib/actions/expenses";
import { CuotaItem } from "./_components/cuota-item";
import { FijoItem } from "./_components/fijo-item";
import { VariableItem } from "./_components/variable-item";
import { LoadBillSheet } from "./_components/load-bill-sheet";
import {
  SegmentedControl,
  type ExpenseFilter,
} from "./_components/segmented-control";
import {
  AddSheet,
  type EditingCuota,
  type EditingVariable,
} from "./_components/add-sheet";
import { DueDayPicker } from "./_components/due-day-picker";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  cuotas: "Compras en cuotas o planes de pago recurrentes",
  fijos: "Agua, luz, expensas y servicios que se repiten cada mes",
  variables: "Gastos puntuales del mes, compartidos o personales",
};

// ── SCHEMAS ───────────────────────────────────────────────────────────────────

const dueDaySchema = z.object({
  due_day: z
    .string()
    .min(1, "Requerido")
    .refine((v) => {
      const n = Number.parseInt(v, 10);
      return !Number.isNaN(n) && n >= 1 && n <= 31;
    }, "Debe ser un número entre 1 y 31"),
});

type DueDayFields = z.infer<typeof dueDaySchema>;

// ── FLOW STATE ────────────────────────────────────────────────────────────────

type FlowState =
  | { step: "idle" }
  | { step: "type-selector" }
  | { step: "service-list" }
  | { step: "edit-service"; instanceId: string }
  | { step: "load-bill"; instanceId: string }
  | { step: "new-service" }
  | { step: "cuota-form" }
  | { step: "edit-cuota"; purchaseId: string }
  | { step: "compra-form" }
  | { step: "edit-variable"; expenseId: string };

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

function SectionLabel({ children }: { readonly children: string }) {
  return (
    <div
      className="mb-1.5 px-1 text-[11px] font-bold uppercase"
      style={{
        color: "var(--fg-3)",
        letterSpacing: "0.05em",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </div>
  );
}

function FilterFunnelIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--fg-2)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ── CATEGORY FILTER SHEET ────────────────────────────────────────────────────

type Categories = NonNullable<ReturnType<typeof useCategories>["data"]>;

interface CategoryFilterSheetProps {
  readonly categories: Categories;
  readonly filterCategory: string | null;
  readonly onSelect: (categoryId: string | null) => void;
  readonly onClose: () => void;
}

function CategoryFilterSheet({
  categories,
  filterCategory,
  onSelect,
  onClose,
}: CategoryFilterSheetProps) {
  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Filtrar por categoría"
      data-testid="category-filter-sheet"
    >
      <div className="flex flex-wrap gap-1.5 pb-4">
        <button
          onClick={() => onSelect(null)}
          className="cursor-pointer rounded-[20px] text-xs font-semibold"
          style={{
            padding: "6px 14px",
            border: "1px solid var(--border-subtle)",
            background:
              filterCategory === null ? "var(--accent)" : "var(--bg-sunken)",
            color: filterCategory === null ? "#fff" : "var(--fg-2)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() =>
                onSelect(filterCategory === cat.id ? null : cat.id)
              }
              className="inline-flex cursor-pointer items-center gap-1 rounded-[20px] text-xs font-semibold"
              style={{
                padding: "6px 14px",
                border: "1px solid var(--border-subtle)",
                background:
                  filterCategory === cat.id
                    ? "var(--accent)"
                    : "var(--bg-sunken)",
                color: filterCategory === cat.id ? "#fff" : "var(--fg-2)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <Icon size={14} aria-hidden="true" /> {cat.name}
            </button>
          );
        })}
      </div>
    </ResponsiveModal>
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
    icon: LucideIcon;
    testId: string;
    onSelect: () => void;
  }> = [
    {
      label: "Servicio",
      description: "Agua, luz, expensas y servicios que se repiten cada mes",
      icon: Home,
      testId: "type-option-servicio",
      onSelect: onSelectServicio,
    },
    {
      label: "Cuota",
      description: "Compra en cuotas, ¿en qué tarjeta?",
      icon: CreditCard,
      testId: "type-option-cuota",
      onSelect: onSelectCuota,
    },
    {
      label: "Compra",
      description: "Super, verdulería, gastos puntuales",
      icon: ShoppingCart,
      testId: "type-option-compra",
      onSelect: onSelectCompra,
    },
  ];

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title="¿Qué querés agregar?"
      data-testid="type-selector-sheet"
    >
      <div className="flex flex-col gap-2.5 pb-4">
        {options.map((opt) => (
          <button
            key={opt.label}
            data-testid={opt.testId}
            onClick={opt.onSelect}
            className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left"
            style={{
              background: "var(--bg-sunken)",
              border: "1.5px solid var(--border-subtle)",
            }}
          >
            <span
              aria-hidden="true"
              style={{ display: "inline-flex", color: "var(--fg-1)" }}
            >
              <opt.icon size={28} />
            </span>
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
    </ResponsiveModal>
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
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Servicios del mes"
      data-testid="service-list-sheet"
    >
      <div
        className="flex flex-col overflow-hidden rounded-2xl"
        style={{
          gap: 1,
          background: "var(--bg-sunken)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {instances.length === 0 && (
          <div
            className="text-center text-[13px]"
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
          // AWAITING_BILL ("sin factura") has no known amount yet — never
          // fabricate "$0" here either (D1's exact trap, just in a list
          // preview instead of a total).
          const billed = isBilled(fi);
          return (
            <button
              key={fi.id}
              onClick={() => onPickInstance(fi.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
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
                    color: billed ? "var(--fg-3)" : "var(--status-pending)",
                    fontFamily: billed
                      ? "var(--font-mono)"
                      : "var(--font-sans)",
                    marginTop: 2,
                  }}
                >
                  {billed ? formatARS(billedFixedAmount(fi)) : "sin monto"}
                </div>
              </div>
              {fi.paid && (
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{
                    color: "var(--status-success-text)",
                    background:
                      "color-mix(in srgb, var(--status-success) 12%, transparent)",
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
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-semibold"
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
    </ResponsiveModal>
  );
}

// ── EDIT SERVICE SHEET ─────────────────────────────────────────────────────────

interface EditServiceSheetProps {
  readonly instance: FixedExpenseInstance;
  readonly coupleId: string;
  readonly month: string;
  readonly onClose: () => void;
  /** Redirects to the "Cargar factura" sheet for this instance instead of
   * closing back to idle — only used from the AWAITING_BILL CTA below. */
  readonly onOpenLoadBill: (instanceId: string) => void;
}

function EditServiceSheet({
  instance,
  coupleId,
  month,
  onClose,
  onOpenLoadBill,
}: EditServiceSheetProps) {
  const queryClient = useQueryClient();
  const isAwaitingBill = instance.status === "AWAITING_BILL";
  const currentAmount = isBilled(instance) ? billedFixedAmount(instance) : 0;
  const currentDueDay =
    instance.due_day ?? instance.fixed_expense_templates.due_day;
  const [draft, setDraft] = useState(String(currentAmount));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [awaitsBill, setAwaitsBill] = useState(
    instance.fixed_expense_templates.awaits_bill,
  );

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<DueDayFields>({
    resolver: zodResolver(dueDaySchema),
    defaultValues: { due_day: String(currentDueDay) },
  });

  const dueDayRaw = useWatch({ control, name: "due_day" });
  const dueDayValue = (() => {
    const n = Number.parseInt(dueDayRaw ?? "", 10);
    return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
  })();

  const amountMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number | null }) =>
      updateFixedExpenseInstanceAmount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-data", coupleId, month],
      });
    },
  });

  const dueDayMutation = useMutation({
    mutationFn: ({ id, dueDay }: { id: string; dueDay: number }) =>
      updateFixedExpenseInstanceDueDay(id, dueDay),
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

  // "Hay que esperar la factura" — template-level flag (394): the ONLY
  // user-reachable way to set `awaits_bill`. Saves immediately on toggle,
  // same pattern as the paid switch above — not batched into the form
  // submit below.
  const awaitsBillMutation = useMutation({
    mutationFn: ({
      templateId,
      value,
    }: {
      templateId: string;
      value: boolean;
    }) => updateFixedExpenseTemplate(templateId, { awaits_bill: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    },
    onError: () => {
      // Revert the optimistic local toggle on failure.
      setAwaitsBill((prev) => !prev);
    },
  });

  // Per-instance override, independent of the template flag — "un mes
  // Expensas no llegó" (394). Only reachable while the instance is
  // currently billed (server-side guarded by canMarkAwaitingBill too).
  const markAwaitingMutation = useMutation({
    mutationFn: (instanceId: string) =>
      markFixedExpenseInstanceAwaitingBill(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      onClose();
    },
    onError: (err: Error) => {
      setFieldError(err.message ?? "No se pudo marcar sin factura");
    },
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      deactivateFixedExpenseTemplate(templateId),
    onSuccess: (_data, templateId) => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      toast.success("Servicio eliminado", {
        action: {
          label: "Deshacer",
          onClick: async () => {
            await reactivateFixedExpenseTemplate(templateId);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
          },
        },
      });
      onClose();
    },
  });

  function handleSave(values: DueDayFields) {
    const dueDay = Number.parseInt(values.due_day, 10);

    // AWAITING_BILL has no amount to save here — it has no amount at all
    // (D1). Loading one is a separate flow (`onOpenLoadBill`); this form
    // only ever touches due day for an unpriced instance.
    if (isAwaitingBill) {
      if (dueDay !== currentDueDay) {
        dueDayMutation.mutate(
          { id: instance.id, dueDay },
          { onSuccess: onClose },
        );
      } else {
        onClose();
      }
      return;
    }

    const parsed = parseAmount(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFieldError("El monto debe ser mayor a cero");
      return;
    }
    setFieldError(null);

    amountMutation.mutate(
      { id: instance.id, amount: parsed },
      {
        onSuccess: () => {
          if (dueDay !== currentDueDay) {
            dueDayMutation.mutate(
              { id: instance.id, dueDay },
              { onSuccess: onClose },
            );
          } else {
            onClose();
          }
        },
      },
    );
  }

  const isPending =
    amountMutation.isPending ||
    toggleMutation.isPending ||
    dueDayMutation.isPending ||
    deleteMutation.isPending ||
    awaitsBillMutation.isPending ||
    markAwaitingMutation.isPending;
  const name = instance.fixed_expense_templates.description;

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={name}
      data-testid="edit-service-sheet"
    >
      <form onSubmit={handleSubmit(handleSave)}>
        {/* Amount edit — AWAITING_BILL has no amount to edit here (D1): a
            $0, editable field would be the exact trap this feature exists
            to close. Redirect to "Cargar factura" instead. */}
        {isAwaitingBill ? (
          <div
            data-testid="awaiting-bill-cta"
            className="mb-3.5 flex items-center justify-between gap-3 rounded-xl"
            style={{
              padding: "11px 12px",
              background: "var(--status-pending-subtle)",
              border: "1px dashed var(--status-pending)",
            }}
          >
            <div>
              <div
                className="text-[13px] font-semibold"
                style={{
                  color: "var(--status-pending)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Sin factura
              </div>
              <div
                className="mt-0.5 text-xs"
                style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
              >
                No suma al gasto real hasta que cargues el monto.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenLoadBill(instance.id)}
              style={{ flexShrink: 0 }}
            >
              Cargar factura
            </Button>
          </div>
        ) : (
          <div className="mb-3.5">
            <label
              htmlFor="edit-service-amount"
              className="mb-1.5 block text-[13px] font-medium"
              style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
            >
              Monto este mes
            </label>
            <div
              className="flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-(--accent)"
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
                type="text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setFieldError(null);
                }}
                inputMode="decimal"
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
                className="mt-1 text-xs"
                style={{ color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}
              >
                Default: {formatARS(instance.fixed_expense_templates.amount)}
              </div>
            )}
            {fieldError && (
              <div
                role="alert"
                className="mt-1 text-xs"
                style={{
                  color: "var(--status-danger-text)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {fieldError}
              </div>
            )}
          </div>
        )}

        {/* Due day edit */}
        <div className="mb-3.5">
          <label
            htmlFor="edit-service-due-day"
            className="mb-1.5 block text-[13px] font-medium"
            style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
          >
            Día de vencimiento
          </label>
          {/* Visually-hidden native input keeps the field addressable while
              the grid is the visual control. */}
          <input
            id="edit-service-due-day"
            data-testid="edit-service-due-day"
            type="text"
            inputMode="numeric"
            className="sr-only"
            {...register("due_day")}
          />
          <DueDayPicker
            value={dueDayValue}
            onChange={(day) =>
              setValue("due_day", String(day), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
          {errors.due_day && (
            <div
              role="alert"
              className="mt-1 text-xs"
              style={{
                color: "var(--status-danger-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {errors.due_day.message}
            </div>
          )}
        </div>

        {/* Paid toggle — disabled while AWAITING_BILL: nothing has been
            billed yet, so "already paid" is not a coherent state. */}
        <div className="mb-5 flex items-center justify-between">
          <span
            className="text-[13px] font-medium"
            style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
          >
            Ya lo pagué
          </span>
          <Switch
            checked={instance.paid}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ id: instance.id, paid: checked })
            }
            disabled={isPending || isAwaitingBill}
            aria-label={
              instance.paid ? "Marcar como no pagado" : "Marcar como pagado"
            }
          />
        </div>

        {/* Template-level flag (394) — the only user-reachable way to set
            `awaits_bill`. "Cada mes arranca sin monto..." copy matches the
            approved mockup's "Editar servicio" screen. */}
        <div
          data-testid="awaits-bill-section"
          className="mb-5 flex items-start gap-2.5 rounded-xl"
          style={{
            padding: "11px 12px",
            background: "var(--accent-subtle)",
          }}
        >
          <Switch
            checked={awaitsBill}
            onCheckedChange={(checked) => {
              setAwaitsBill(checked);
              awaitsBillMutation.mutate({
                templateId: instance.template_id,
                value: checked,
              });
            }}
            disabled={isPending}
            data-testid="toggle-awaits-bill"
            aria-label="Hay que esperar la factura"
          />
          <div>
            <div
              className="text-[13px] font-semibold"
              style={{ color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}
            >
              Hay que esperar la factura
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
            >
              Cada mes arranca sin monto y no suma hasta que la cargues.
            </div>
          </div>
        </div>

        {/* Per-instance override (394) — "un mes Expensas no llegó": marks
            only THIS month's instance, independent of the template flag
            above. Only reachable while the instance is currently billed. */}
        {!isAwaitingBill && (
          <button
            type="button"
            data-testid="mark-awaiting-bill"
            onClick={() => markAwaitingMutation.mutate(instance.id)}
            disabled={isPending}
            className="mb-5 w-full"
            style={{
              background: "var(--bg-sunken)",
              border: "1px dashed var(--status-pending)",
              borderRadius: 10,
              cursor: "pointer",
              padding: "9px 4px",
              color: "var(--status-pending)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            Marcar sin factura este mes
          </button>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          Guardar
        </Button>

        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={isPending}
          className="mt-2.5 w-full"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "var(--status-danger-text)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          Eliminar servicio
        </button>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar servicio?"
        description={`"${name}" dejará de aparecer en los próximos meses. Se conserva el historial de los meses anteriores.`}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={() => deleteMutation.mutate(instance.template_id)}
      />
    </ResponsiveModal>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

// Maps the internal filter value to a user-facing URL param and back.
const FILTER_TO_PARAM: Record<ExpenseFilter, string | null> = {
  todo: null,
  cuotas: "cuotas",
  fijos: "servicios",
  variables: "compras",
};
const PARAM_TO_FILTER: Record<string, ExpenseFilter> = {
  cuotas: "cuotas",
  servicios: "fijos",
  compras: "variables",
};

function flowStepToAddTab(step: FlowState["step"]): Tab | null {
  if (step === "cuota-form" || step === "edit-cuota") return "cuotas";
  if (step === "new-service") return "fijos";
  if (step === "compra-form" || step === "edit-variable") return "variables";
  return null;
}

/** Forces AddSheet to remount when the flow switches target (add vs a
 * specific edit target) — otherwise react-hook-form's `defaultValues` (set
 * once at mount) would keep showing stale data from a previous edit. */
function flowKey(flow: FlowState): string {
  if (flow.step === "edit-cuota") return `edit-cuota:${flow.purchaseId}`;
  if (flow.step === "edit-variable") return `edit-variable:${flow.expenseId}`;
  return flow.step;
}

function ExpensesView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<ExpenseFilter>(
    () => PARAM_TO_FILTER[searchParams.get("tipo") ?? ""] ?? "todo",
  );
  const [flow, setFlow] = useState<FlowState>({ step: "idle" });
  const [filterCategory, setFilterCategory] = useState<string | null>(() =>
    searchParams.get("cat"),
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Sync filter + category to the URL (?tipo=...&cat=...). Defaults = clean URL.
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const tipo = FILTER_TO_PARAM[filter];
    if (tipo) params.set("tipo", tipo);
    else params.delete("tipo");
    if (filterCategory) params.set("cat", filterCategory);
    else params.delete("cat");
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL sync keys on filter/category; router/searchParams/pathname are stable and excluded to avoid loops
  }, [filter, filterCategory]);

  // Map flow steps to AddSheet tab — must be computed before useExpenseSave
  const addSheetTab: Tab | null = flowStepToAddTab(flow.step);

  const { save, saveError } = useExpenseSave(
    addSheetTab ?? (filter === "todo" ? "cuotas" : filter),
  );

  function handleFilterChange(newFilter: ExpenseFilter) {
    setFilter(newFilter);
    setFilterCategory(null);
  }

  function handleCategorySelect(categoryId: string | null) {
    setFilterCategory(categoryId);
    setFilterSheetOpen(false);
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
    isShared: boolean,
    payerId?: string | null,
    cardId?: string | null,
  ) {
    // Commit 6: resolve the edit target BEFORE resetting flow to "idle" —
    // once reset, the step/id info needed to route create vs. update is gone.
    const editId =
      flow.step === "edit-cuota"
        ? flow.purchaseId
        : flow.step === "edit-variable"
          ? flow.expenseId
          : null;
    setFlow({ step: "idle" });
    save(fields, categoryId, autoRenew, isShared, payerId, cardId, editId);
  }

  const allCuotas = data?.installmentPurchases ?? [];
  const allFijos = data?.fixedExpenseInstances ?? [];
  const allVariables = data?.variableExpenses ?? [];

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

  // "N sin factura — no están contados" + the per-row reference line both
  // key off the currently VISIBLE (filtered) fijos — a hidden category's
  // awaiting rows don't need their reference amount fetched either.
  const awaitingFijosCount = fijos.filter(
    (fi) => fi.status === "AWAITING_BILL",
  ).length;
  const { data: lastBilledAmounts } = useLastBilledAmounts(
    coupleId,
    month,
    awaitingFijosCount,
  );

  const showTodo = filter === "todo";
  const cuotasVisible = filter === "cuotas" || (showTodo && cuotas.length > 0);
  const fijosVisible = filter === "fijos" || (showTodo && fijos.length > 0);
  const variablesVisible =
    filter === "variables" || (showTodo && variables.length > 0);
  const allEmpty =
    cuotas.length === 0 && fijos.length === 0 && variables.length === 0;

  // Resolve the active fixed instance for edit-service step
  const activeInstance =
    flow.step === "edit-service"
      ? (allFijos.find((fi) => fi.id === flow.instanceId) ?? null)
      : null;

  // Resolve the active fixed instance for the "Cargar factura" sheet
  const loadBillInstance =
    flow.step === "load-bill"
      ? (allFijos.find((fi) => fi.id === flow.instanceId) ?? null)
      : null;

  // Commit 6: resolve the cuota/variable being edited — feeds AddSheet's
  // editingCuota/editingVariable props (reused in "edit mode").
  const editingCuota: EditingCuota | null =
    flow.step === "edit-cuota"
      ? (allCuotas.find((c) => c.id === flow.purchaseId) ?? null)
      : null;
  const editingVariable: EditingVariable | null =
    flow.step === "edit-variable"
      ? (allVariables.find((v) => v.id === flow.expenseId) ?? null)
      : null;

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: "100%",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          paddingTop: 14,
        }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <h1
            className="m-0 px-5 pb-2.5 text-lg font-bold"
            style={{
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Gastos
          </h1>
          <div className="flex items-center gap-2 px-4 pb-2.5">
            <div className="flex-1">
              <SegmentedControl active={filter} onChange={handleFilterChange} />
            </div>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterSheetOpen(true)}
                aria-label="Más filtros"
                data-testid="expenses-filters-button"
                className="relative flex shrink-0 cursor-pointer items-center justify-center rounded-xl"
                style={{
                  width: 40,
                  height: 40,
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <FilterFunnelIcon />
                {filterCategory !== null && (
                  <span
                    className="absolute flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      background: "var(--accent)",
                      color: "var(--accent-foreground)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    1
                  </span>
                )}
              </button>
            )}
          </div>
          {!showTodo && <TabDescription tab={filter} />}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-3">
          {showTodo && allEmpty && (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}
            >
              Sin gastos este mes. Usá el + para agregar.
            </div>
          )}

          {/* CUOTAS */}
          {cuotasVisible && (
            <div>
              {showTodo && <SectionLabel>Cuotas</SectionLabel>}
              {filter === "cuotas" && cuotas.length === 0 && (
                <div
                  className="py-12 text-center text-sm"
                  style={{
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Sin compras en cuotas. Usá el + para agregar.
                </div>
              )}
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {cuotas.map((c) => (
                  <li key={c.id}>
                    <CuotaItem
                      c={c}
                      cards={data?.cards ?? []}
                      overrides={data?.installmentMonthOverrides ?? []}
                      month={month}
                      getPersonInitials={getPersonInitials}
                      getPerson={getPerson}
                      onEdit={(id) =>
                        setFlow({ step: "edit-cuota", purchaseId: id })
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FIJOS */}
          {fijosVisible && (
            <div>
              {showTodo && <SectionLabel>Servicios</SectionLabel>}
              {filter === "fijos" && fijos.length === 0 && (
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
                  <ul
                    className="m-0 flex list-none flex-col overflow-hidden rounded-2xl p-0"
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
                          onEditDueDay={(id) =>
                            setFlow({ step: "edit-service", instanceId: id })
                          }
                          onLoadBill={(id) =>
                            setFlow({ step: "load-bill", instanceId: id })
                          }
                          referenceAmount={
                            fi.status === "AWAITING_BILL"
                              ? (lastBilledAmounts?.[fi.template_id] ?? null)
                              : null
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  <div
                    className="mt-2 rounded-xl px-4 py-3"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex justify-between">
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
                            (s, fi) =>
                              isBilled(fi) ? s + billedFixedAmount(fi) : s,
                            0,
                          ),
                        )}
                      </span>
                    </div>
                    {awaitingFijosCount > 0 && (
                      <div
                        data-testid="awaiting-fijos-hint"
                        className="mt-2.5 flex items-center gap-1.5 pt-2.5 text-xs"
                        style={{
                          borderTop: "1px solid var(--border-subtle)",
                          // `--fg-3` fails AA on dark `--bg-elevated` (3.44:1,
                          // a real axe finding) — `--fg-2` (6.23:1+) instead.
                          color: "var(--fg-2)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        <Info aria-hidden size={13} />
                        {awaitingFijosCount === 1
                          ? "1 sin factura — no está contada"
                          : `${awaitingFijosCount} sin factura — no están contados`}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VARIABLES */}
          {variablesVisible && (
            <div>
              {showTodo && <SectionLabel>Compras</SectionLabel>}
              {filter === "variables" && variables.length === 0 && (
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
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {variables.map((v) => (
                  <li key={v.id}>
                    <VariableItem
                      v={v}
                      getPersonInitials={getPersonInitials}
                      getPerson={getPerson}
                      onEdit={(id) =>
                        setFlow({ step: "edit-variable", expenseId: id })
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {filterSheetOpen && (
        <CategoryFilterSheet
          categories={categories}
          filterCategory={filterCategory}
          onSelect={handleCategorySelect}
          onClose={() => setFilterSheetOpen(false)}
        />
      )}

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
          onOpenLoadBill={(id) =>
            setFlow({ step: "load-bill", instanceId: id })
          }
        />
      )}

      {/* CARGAR FACTURA */}
      {flow.step === "load-bill" && loadBillInstance && coupleId && data && (
        <LoadBillSheet
          instance={loadBillInstance}
          coupleId={coupleId}
          month={month}
          referenceAmount={
            lastBilledAmounts?.[loadBillInstance.template_id] ?? null
          }
          members={profiles}
          currentUserId={member?.user_id}
          monthlyData={data}
          onClose={() => setFlow({ step: "idle" })}
        />
      )}

      {/* CUOTA / NEW-SERVICE / COMPRA FORMS — reuse AddSheet with correct tab.
          For edit-cuota/edit-variable, wait until the target row resolves
          from already-fetched monthly data (avoids flashing a blank "create"
          form for one render while the list is still loading). */}
      {addSheetTab !== null &&
        (flow.step !== "edit-cuota" || editingCuota !== null) &&
        (flow.step !== "edit-variable" || editingVariable !== null) && (
          <AddSheet
            key={flowKey(flow)}
            tab={addSheetTab}
            categories={categories}
            onClose={() => setFlow({ step: "idle" })}
            onSave={handleSave}
            saveError={saveError}
            members={profiles}
            currentUserId={member?.user_id ?? undefined}
            coupleId={coupleId}
            editingCuota={editingCuota}
            editingVariable={editingVariable}
          />
        )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesView />
    </Suspense>
  );
}
