"use client";

import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CategoryPicker } from "@/components/shared/category-picker";
import { PersonAvatar } from "@/components/shared/avatar";
import { useCategories } from "@/lib/queries/use-monthly-data";
import type { Tab } from "@/lib/queries/use-expense-save";
import { TAB_LABEL } from "./segmented-control";
import { computeMonthlyInstallment } from "@/lib/utils/installments";
import { cn, formatARS, getInitials } from "@/lib/utils";

// ── SCHEMAS ───────────────────────────────────────────────────────────────────

function normalizeAmount(raw: string): number {
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let s: string;
  if (hasComma && hasDot) {
    s = raw.replaceAll(".", "").replace(",", ".");
  } else if (hasComma) {
    s = raw.replace(",", ".");
  } else {
    s = raw;
  }
  return Number(s);
}

function positiveMoneyString(field = "El monto") {
  return z
    .string()
    .min(1, "Requerido")
    .refine(
      (v) => { const n = normalizeAmount(v); return !Number.isNaN(n) && n > 0; },
      `${field} debe ser mayor a 0`,
    );
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
  credit_card: z.string().trim().max(40).optional(),
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
  color: "var(--status-danger)",
  marginTop: 4,
  fontFamily: "var(--font-sans)",
};

const schemas: Record<Tab, z.ZodTypeAny> = {
  cuotas: cuotasSchema,
  fijos: fijosSchema,
  variables: variablesSchema,
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
          inputMode="numeric"
          placeholder="0"
          className={cn(
            "flex-1 border-none bg-transparent shadow-none outline-none focus-visible:ring-0",
            "font-mono font-semibold text-base",
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
  mono = false,
}: Readonly<{
  label: string;
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  mono?: boolean;
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
  ) => void;
  readonly members?: { user_id: string; full_name: string }[];
  readonly currentUserId?: string;
  readonly saveError?: string | null;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [requiresMonthlyReview, setRequiresMonthlyReview] = useState(false);
  const [isShared, setIsShared] = useState(true);
  const [payerId, setPayerId] = useState<string | null>(currentUserId ?? null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: zodResolver(schemas[tab]) });

  // Live monthly installment calculation (cuotas tab only)
  const totalAmountRaw = useWatch({ control, name: "total_amount" });
  const installmentsRaw = useWatch({ control, name: "installments" });
  const monthlyAmount = useMemo(() => {
    const total = Number.parseFloat(totalAmountRaw?.replace(",", ".") ?? "");
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
      tab === "cuotas" ? payerId : undefined,
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        data-testid="add-sheet-dialog"
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="mx-auto w-full sm:max-w-120 rounded-t-[20px]"
        style={{
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
              textTransform: "capitalize",
            }}
          >
            Nuevo gasto — {TAB_LABEL[tab]}
          </SheetTitle>
        </SheetHeader>

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
              <InputField
                label="Tarjeta (opcional)"
                id="field-credit-card"
                registration={register("credit_card")}
                error={errors.credit_card?.message}
              />
              <InputField
                label="Fecha del primer pago"
                id="field-first-payment-date"
                registration={register("first_payment_date")}
                error={errors.first_payment_date?.message}
                type="date"
              />
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
            <InputField
              label="Día de vencimiento (1-31)"
              id="field-due-day"
              registration={register("due_day")}
              error={errors.due_day?.message}
              mono
            />
          )}

          {tab === "fijos" && (
            <div
              style={{
                marginBottom: 14,
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

          {tab === "variables" && (
            <div
              style={{
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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

          {tab === "cuotas" && members && members.length >= 2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelCss, marginBottom: 8 }}>¿Quién paga?</div>
              <div data-testid="payer-selector" style={{ display: "flex", gap: 8 }}>
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
                Renovar automáticamente
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
                background: "color-mix(in srgb, var(--status-danger) 10%, transparent)",
                borderRadius: 8,
                border: "1px solid var(--status-danger)",
              }}
            >
              {saveError}
            </div>
          )}

          <Button type="submit" style={{ width: "100%" }}>
            Guardar
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
