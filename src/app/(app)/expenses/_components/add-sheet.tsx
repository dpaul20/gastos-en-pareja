"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CategoryPicker } from "@/components/shared/category-picker";
import { useCategories } from "@/lib/queries/use-monthly-data";
import type { Tab } from "@/lib/queries/use-expense-save";

// ── SCHEMAS ───────────────────────────────────────────────────────────────────
const cuotasSchema = z.object({
  description: z.string().min(1, "Requerido"),
  total_amount: z.string().min(1, "Requerido"),
  installments: z.string().min(1, "Requerido"),
  first_payment_date: z.string().optional(),
});

const fijosSchema = z.object({
  description: z.string().min(1, "Requerido"),
  amount: z.string().min(1, "Requerido"),
  due_day: z.string().min(1, "Requerido"),
});

const variablesSchema = z.object({
  description: z.string().min(1, "Requerido"),
  amount: z.string().min(1, "Requerido"),
  date: z.string().optional(),
});

type Fields = Partial<
  z.infer<typeof cuotasSchema> &
    z.infer<typeof fijosSchema> &
    z.infer<typeof variablesSchema>
>;

const schemas: Record<Tab, z.ZodTypeAny> = {
  cuotas: cuotasSchema,
  fijos: fijosSchema,
  variables: variablesSchema,
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
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
        <input
          id={id}
          {...registration}
          inputMode="numeric"
          placeholder="0"
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
      <input
        id={id}
        {...registration}
        type={type}
        style={{
          width: "100%",
          border: "1.5px solid var(--border-default)",
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 15,
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontWeight: mono ? 600 : undefined,
          outline: "none",
          background: "var(--bg-elevated)",
          color: "var(--fg-1)",
          boxSizing: "border-box",
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
}: {
  readonly tab: Tab;
  readonly categories: ReturnType<typeof useCategories>["data"];
  readonly onClose: () => void;
  readonly onSave: (
    data: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
  ) => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: zodResolver(schemas[tab]) });

  function onSubmit(data: Fields) {
    onSave(
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
      categoryId,
      autoRenew,
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
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
              textTransform: "capitalize",
            }}
          >
            Nuevo gasto — {tab}
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
              <InputField
                label="Primer pago"
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
              label="Día de vencimiento (1–31)"
              id="field-due-day"
              registration={register("due_day")}
              error={errors.due_day?.message}
              mono
            />
          )}

          {tab === "variables" && (
            <InputField
              label="Fecha"
              id="field-date"
              registration={register("date")}
              error={errors.date?.message}
              type="date"
            />
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
              <button
                type="button"
                onClick={() => setAutoRenew((a) => !a)}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 99,
                  border: "none",
                  cursor: "pointer",
                  background: autoRenew
                    ? "var(--accent)"
                    : "var(--border-default)",
                  transition: "background 150ms",
                  position: "relative",
                }}
                aria-label="Auto-renovar"
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 99,
                    background: "white",
                    position: "absolute",
                    top: 3,
                    left: autoRenew ? 21 : 3,
                    transition: "left 150ms",
                  }}
                />
              </button>
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
