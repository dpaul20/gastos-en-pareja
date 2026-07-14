"use client";

import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { CategoryPicker } from "@/components/shared/category-picker";
import { PersonAvatar } from "@/components/shared/avatar";
import { useCategories } from "@/lib/queries/use-monthly-data";
import type { Tab } from "@/lib/queries/use-expense-save";
import { TAB_LABEL } from "./segmented-control";
import { DueDayPicker } from "./due-day-picker";
import { CardPicker } from "./card-picker";
import { computeMonthlyInstallment } from "@/lib/utils/installments";
import { cn, formatARS, getInitials } from "@/lib/utils";
import { parseAmount } from "@/lib/utils/amount";

// ── SCHEMAS ───────────────────────────────────────────────────────────────────

function positiveMoneyString(field = "El monto") {
  return z
    .string()
    .min(1, "Requerido")
    .refine((v) => {
      const n = parseAmount(v);
      return !Number.isNaN(n) && n > 0;
    }, `${field} debe ser mayor a 0`);
}

function positiveIntString(max = 999) {
  return z
    .string()
    .min(1, "Requerido")
    .refine((v) => {
      const n = Number.parseInt(v, 10);
      return !isNaN(n) && n >= 1 && n <= max;
    }, `Debe ser un número entre 1 y ${max}`);
}

const cuotasSchema = z.object({
  description: z.string().min(1, "Requerido"),
  total_amount: positiveMoneyString("El monto total"),
  installments: positiveIntString(999),
  first_payment_date: z.string().optional(),
});

const fijosSchema = z.object({
  description: z.string().min(1, "Requerido"),
  amount: positiveMoneyString(),
  due_day: positiveIntString(31),
});

const variablesSchema = z.object({
  description: z.string().min(1, "Requerido"),
  amount: positiveMoneyString(),
  date: z.string().optional(),
});

type Fields = Partial<
  z.infer<typeof cuotasSchema> &
    z.infer<typeof fijosSchema> &
    z.infer<typeof variablesSchema>
>;

// Commit 6 — edit parity: the add-sheet is reused in "edit mode" for cuotas
// and variables (fijos keeps its own bespoke EditServiceSheet, which already
// covers monto/due-day/paid/delete). These are plain field shapes, not the
// full DB row, so add-sheet.tsx doesn't need to import MonthlyData types.
export interface EditingCuota {
  readonly id: string;
  readonly description: string;
  readonly total_amount: number;
  readonly installments: number;
  readonly category_id: string | null;
  readonly auto_renew: boolean;
  readonly card_id: string | null;
  readonly paid_by_user_id: string | null;
}

export interface EditingVariable {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly date: string;
  readonly category_id: string | null;
  readonly is_shared: boolean;
}

const labelCss: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--fg-2)",
  marginBottom: 5,
  fontFamily: "var(--font-sans)",
};

const errorCss: React.CSSProperties = {
  fontSize: 12,
  color: "var(--status-danger-text)",
  marginTop: 4,
  fontFamily: "var(--font-sans)",
};

const schemas: Record<Tab, z.ZodTypeAny> = {
  cuotas: cuotasSchema,
  fijos: fijosSchema,
  variables: variablesSchema,
};

const SAVE_LABEL: Record<Tab, string> = {
  fijos: "Guardar servicio",
  cuotas: "Guardar cuota",
  variables: "Guardar compra",
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

// Monetary input: DS pattern — wrapper div + $ prefix + borderless inner input
function MoneyField({
  label,
  id,
  registration,
  error,
}: Readonly<{
  label: string;
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
}>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={labelCss}>
        {label}
      </label>
      <div
        className="focus-within:ring-2 focus-within:ring-(--accent)"
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
        <Input
          id={id}
          {...registration}
          inputMode="decimal"
          placeholder=""
          className={cn(
            "flex-1 border-none bg-transparent shadow-none outline-none focus-visible:ring-0",
            "font-mono text-base font-semibold",
          )}
          style={{
            padding: "10px 12px 10px 4px",
            color: "var(--fg-1)",
          }}
        />
      </div>
      {error && (
        <div role="alert" style={errorCss}>
          {error}
        </div>
      )}
    </div>
  );
}

// Text / date / numeric-count input
function InputField({
  label,
  id,
  registration,
  error,
  type = "text",
  inputMode,
  mono = false,
  placeholder,
}: Readonly<{
  label: string;
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  mono?: boolean;
  placeholder?: string;
}>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={labelCss}>
        {label}
      </label>
      <Input
        id={id}
        {...registration}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl px-3.5 py-3 text-[15px]",
          mono && "font-mono font-semibold",
        )}
        style={{
          border: "1.5px solid var(--border-default)",
          background: "var(--bg-elevated)",
          color: "var(--fg-1)",
        }}
      />
      {error && (
        <div role="alert" style={errorCss}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function AddSheet({
  tab,
  categories,
  onClose,
  onSave,
  saveError,
  members,
  currentUserId,
  coupleId,
  editingCuota = null,
  editingVariable = null,
}: {
  readonly tab: Tab;
  readonly categories: ReturnType<typeof useCategories>["data"];
  readonly onClose: () => void;
  readonly onSave: (
    data: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
    requiresMonthlyReview: boolean,
    isShared: boolean,
    payerId?: string | null,
    cardId?: string | null,
  ) => void;
  readonly members?: { user_id: string; full_name: string }[];
  readonly currentUserId?: string;
  readonly saveError?: string | null;
  readonly coupleId?: string | null;
  /** Commit 6: when set, the sheet edits this cuota instead of creating one. */
  readonly editingCuota?: EditingCuota | null;
  /** Commit 6: when set, the sheet edits this variable instead of creating one. */
  readonly editingVariable?: EditingVariable | null;
}) {
  const isEditing = editingCuota !== null || editingVariable !== null;
  const [categoryId, setCategoryId] = useState<string | null>(
    editingCuota?.category_id ?? editingVariable?.category_id ?? null,
  );
  const [autoRenew, setAutoRenew] = useState(editingCuota?.auto_renew ?? false);
  const [requiresMonthlyReview, setRequiresMonthlyReview] = useState(false);
  const [isShared, setIsShared] = useState(editingVariable?.is_shared ?? true);
  const [payerId, setPayerId] = useState<string | null>(
    editingCuota?.paid_by_user_id ?? currentUserId ?? null,
  );
  const [cardId, setCardId] = useState<string | null>(
    editingCuota?.card_id ?? null,
  );

  const defaultValues: Fields = editingCuota
    ? {
        description: editingCuota.description,
        total_amount: String(editingCuota.total_amount),
        installments: String(editingCuota.installments),
      }
    : editingVariable
      ? {
          description: editingVariable.description,
          amount: String(editingVariable.amount),
          date: editingVariable.date,
        }
      : {};

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schemas[tab]),
    defaultValues,
  });

  // Selected due day (fijos tab) — drives the grid picker highlight
  const dueDayRaw = useWatch({ control, name: "due_day" });
  const dueDayValue = useMemo(() => {
    const n = Number.parseInt(dueDayRaw ?? "", 10);
    return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
  }, [dueDayRaw]);

  // Live monthly installment calculation (cuotas tab only)
  const totalAmountRaw = useWatch({ control, name: "total_amount" });
  const installmentsRaw = useWatch({ control, name: "installments" });
  const monthlyAmount = useMemo(() => {
    const total = parseAmount(totalAmountRaw ?? "");
    const count = Number.parseInt(installmentsRaw ?? "", 10);
    if (!Number.isFinite(total) || !Number.isFinite(count) || count <= 0)
      return null;
    return computeMonthlyInstallment(total, count);
  }, [totalAmountRaw, installmentsRaw]);

  function onSubmit(data: Fields) {
    onSave(
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
      categoryId,
      autoRenew,
      requiresMonthlyReview,
      isShared,
      tab === "cuotas" || (tab === "fijos" && !isShared) ? payerId : undefined,
      tab === "cuotas" ? cardId : undefined,
    );
  }

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={
        isEditing
          ? `Editar — ${TAB_LABEL[tab]}`
          : `Nuevo gasto — ${TAB_LABEL[tab]}`
      }
      data-testid="add-sheet-dialog"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Descripción"
          id="field-description"
          registration={register("description")}
          error={errors.description?.message}
        />

        {tab === "cuotas" && (
          <>
            <MoneyField
              label="Monto total"
              id="field-total-amount"
              registration={register("total_amount")}
              error={errors.total_amount?.message}
            />
            <InputField
              label="Cuotas"
              id="field-installments"
              registration={register("installments")}
              error={errors.installments?.message}
              inputMode="numeric"
              placeholder="ej: 12"
              mono
            />
            {monthlyAmount !== null && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-2)",
                  marginTop: -10,
                  marginBottom: 14,
                  fontFamily: "var(--font-sans)",
                }}
              >
                ≈ {formatARS(monthlyAmount)} / mes
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelCss, marginBottom: 8 }}>
                Tarjeta (opcional)
              </div>
              <CardPicker
                coupleId={coupleId ?? null}
                value={cardId}
                onChange={setCardId}
              />
            </div>
            {/* Commit 6: editing never moves first_payment_date — changing it
                would shift isInstallmentActiveInMonth's gating window, which
                is out of scope for an "error correction" edit (R3-C/design
                decision A only covers amount/installments recalc-all). */}
            {!isEditing && (
              <InputField
                label="Fecha del primer pago"
                id="field-first-payment-date"
                registration={register("first_payment_date")}
                error={errors.first_payment_date?.message}
                type="date"
              />
            )}
          </>
        )}

        {(tab === "fijos" || tab === "variables") && (
          <MoneyField
            label="Monto"
            id="field-amount"
            registration={register("amount")}
            error={errors.amount?.message}
          />
        )}

        {tab === "fijos" && (
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="field-due-day" style={labelCss}>
              Día de vencimiento (1-31)
            </label>
            {/* Visually-hidden native input keeps the field addressable/fillable
                for a11y + e2e while the grid is the visual control. */}
            <input
              id="field-due-day"
              data-testid="field-due-day"
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
            {errors.due_day?.message && (
              <div role="alert" style={errorCss}>
                {errors.due_day.message}
              </div>
            )}
          </div>
        )}

        {tab === "fijos" && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 44,
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
              Pedirme confirmación cada mes
            </span>
            <Switch
              checked={requiresMonthlyReview}
              onCheckedChange={setRequiresMonthlyReview}
              data-testid="toggle-requires-review"
              aria-label="Pedirme confirmación cada mes"
            />
          </div>
        )}

        {tab === "variables" && (
          <InputField
            label="Fecha (AAAA-MM-DD)"
            id="field-date"
            registration={register("date")}
            error={errors.date?.message}
            type="date"
          />
        )}

        {(tab === "variables" || tab === "fijos") && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 44,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {isShared ? "Gasto compartido" : "Gasto personal"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                  marginTop: 2,
                }}
              >
                {isShared
                  ? "Entra en el balance proporcional"
                  : "No afecta el balance entre los dos"}
              </div>
            </div>
            <Switch
              checked={isShared}
              onCheckedChange={setIsShared}
              data-testid="toggle-is-shared"
              aria-label="Gasto compartido"
            />
          </div>
        )}

        {categories && categories.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...labelCss, marginBottom: 8 }}>Categoría</div>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}

        {(tab === "cuotas" || (tab === "fijos" && !isShared)) &&
          members &&
          members.length >= 2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelCss, marginBottom: 8 }}>¿Quién paga?</div>
              <div
                data-testid="payer-selector"
                style={{ display: "flex", gap: 8 }}
              >
                {members.map((m, idx) => {
                  const person: "a" | "b" = idx === 0 ? "a" : "b";
                  const isSelected = payerId === m.user_id;
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      data-testid={`payer-option-${m.user_id}`}
                      onClick={() => setPayerId(m.user_id)}
                      aria-pressed={isSelected}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : "1.5px solid var(--border-default)",
                        background: isSelected
                          ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                          : "var(--bg-sunken)",
                        cursor: "pointer",
                        transition: "border 150ms, background 150ms",
                      }}
                    >
                      <PersonAvatar
                        initials={getInitials(m.full_name)}
                        person={person}
                        size="sm"
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? "var(--accent)" : "var(--fg-1)",
                          fontFamily: "var(--font-sans)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.full_name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {tab === "cuotas" && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 44,
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Renovar automáticamente
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Las cuotas se reinician al terminar
              </span>
            </span>
            <Switch
              checked={autoRenew}
              onCheckedChange={setAutoRenew}
              aria-label="Renovación automática"
            />
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            style={{
              ...errorCss,
              marginBottom: 12,
              padding: "8px 12px",
              background:
                "color-mix(in srgb, var(--status-danger) 10%, transparent)",
              borderRadius: 8,
              border: "1px solid var(--status-danger-text)",
            }}
          >
            {saveError}
          </div>
        )}

        <Button type="submit" style={{ width: "100%" }}>
          {isEditing ? "Guardar cambios" : SAVE_LABEL[tab]}
        </Button>
      </form>
    </ResponsiveModal>
  );
}
