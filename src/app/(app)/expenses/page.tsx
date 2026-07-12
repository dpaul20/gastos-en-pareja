"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, CreditCard, ShoppingCart, type LucideIcon } from "lucide-react";
import { FAB as Fab } from "@/components/shared/fab";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatARS, getMonthDate, getInitials, cn } from "@/lib/utils";
import { effectiveFixedAmount } from "@/lib/utils/balance";
import { parseAmount } from "@/lib/utils/amount";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useExpenseSave, type Tab } from "@/lib/queries/use-expense-save";
import {
  updateFixedExpenseInstanceAmount,
  updateFixedExpenseInstanceDueDay,
  toggleFixedExpenseInstance,
  confirmAllFixedExpenseInstances,
  deactivateFixedExpenseTemplate,
  reactivateFixedExpenseTemplate,
} from "@/lib/actions/expenses";
import { CuotaItem } from "./_components/cuota-item";
import { FijoItem } from "./_components/fijo-item";
import { VariableItem } from "./_components/variable-item";
import {
  SegmentedControl,
  type ExpenseFilter,
} from "./_components/segmented-control";
import { AddSheet } from "./_components/add-sheet";
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
          const amount = effectiveFixedAmount(fi);
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
}

function EditServiceSheet({
  instance,
  coupleId,
  month,
  onClose,
}: EditServiceSheetProps) {
  const queryClient = useQueryClient();
  const currentAmount = effectiveFixedAmount(instance);
  const currentDueDay =
    instance.due_day ?? instance.fixed_expense_templates.due_day;
  const [draft, setDraft] = useState(String(currentAmount));
  const [fieldError, setFieldError] = useState<string | null>(null);

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
    const parsed = parseAmount(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFieldError("El monto debe ser mayor a cero");
      return;
    }
    setFieldError(null);
    const dueDay = Number.parseInt(values.due_day, 10);

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
    deleteMutation.isPending;
  const name = instance.fixed_expense_templates.description;

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={name}
      data-testid="edit-service-sheet"
    >
      <form onSubmit={handleSubmit(handleSave)}>
        {/* Amount edit */}
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

        {/* Paid toggle */}
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
            disabled={isPending}
            aria-label={
              instance.paid ? "Marcar como no pagado" : "Marcar como pagado"
            }
          />
        </div>

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
  if (step === "cuota-form") return "cuotas";
  if (step === "new-service") return "fijos";
  if (step === "compra-form") return "variables";
  return null;
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
    requiresMonthlyReview: boolean,
    isShared: boolean,
    payerId?: string | null,
  ) {
    setFlow({ step: "idle" });
    save(
      fields,
      categoryId,
      autoRenew,
      requiresMonthlyReview,
      isShared,
      payerId,
    );
  }

  const queryClient = useQueryClient();

  const confirmAllMutation = useMutation({
    mutationFn: () => confirmAllFixedExpenseInstances(coupleId!, month),
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
                      getPersonInitials={getPersonInitials}
                      getPerson={getPerson}
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
                          border: `1.5px solid var(--status-danger-text)`,
                          background:
                            "color-mix(in srgb, var(--status-danger) 10%, transparent)",
                          color: "var(--status-danger-text)",
                        }}
                      >
                        Confirmar todos
                      </Button>
                    </div>
                  )}
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
                        />
                      </li>
                    ))}
                  </ul>
                  <div
                    className="mt-2 flex justify-between rounded-xl px-4 py-3"
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
