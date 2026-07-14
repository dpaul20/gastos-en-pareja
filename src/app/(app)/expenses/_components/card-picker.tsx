"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCard } from "@/lib/actions/cards";
import { useCards } from "@/lib/queries/use-cards";
import { DueDayPicker } from "./due-day-picker";
import type { Database } from "@/types/database";

type CardRow = Database["public"]["Tables"]["cards"]["Row"];

// ── SCHEMA ────────────────────────────────────────────────────────────────

const newCardSchema = z.object({
  name: z.string().trim().min(1, "Requerido").max(40, "Máximo 40 caracteres"),
});

type NewCardFields = z.infer<typeof newCardSchema>;

// ── STYLES ────────────────────────────────────────────────────────────────

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

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "5px 10px",
    borderRadius: 99,
    border: "none",
    cursor: "pointer",
    background: selected ? "var(--accent)" : "var(--bg-sunken)",
    color: selected ? "var(--accent-foreground)" : "var(--fg-2)",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    minHeight: 32,
    whiteSpace: "nowrap",
  };
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// Inline "create a card" mini-form — no nested modal, per spec ("create a
// new one inline"): expands within the same dialog as the picker.
function NewCardForm({
  coupleId,
  onCancel,
  onCreated,
}: Readonly<{
  coupleId: string;
  onCancel: () => void;
  onCreated: (card: CardRow) => void;
}>) {
  const queryClient = useQueryClient();
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewCardFields>({ resolver: zodResolver(newCardSchema) });

  async function onSubmit(values: NewCardFields) {
    setSaveError(null);
    setIsSaving(true);
    try {
      const card = await createCard({
        name: values.name.trim(),
        payment_day: paymentDay,
      });
      queryClient.invalidateQueries({ queryKey: ["cards", coupleId] });
      onCreated(card);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "No se pudo crear la tarjeta",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      data-testid="new-card-form"
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        border: "1.5px dashed var(--border-default)",
        background: "var(--bg-sunken)",
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="new-card-name" style={labelCss}>
          Nombre de la tarjeta
        </label>
        <Input
          id="new-card-name"
          {...register("name")}
          placeholder="ej: Visa Santander"
          className="w-full rounded-xl px-3.5 py-3 text-[15px]"
          style={{
            border: "1.5px solid var(--border-default)",
            background: "var(--bg-elevated)",
            color: "var(--fg-1)",
          }}
        />
        {errors.name?.message && (
          <div role="alert" style={errorCss}>
            {errors.name.message}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...labelCss, marginBottom: 8 }}>
          Día de pago (opcional)
        </div>
        <DueDayPicker value={paymentDay} onChange={setPaymentDay} />
      </div>
      {saveError && (
        <div role="alert" style={{ ...errorCss, marginBottom: 10 }}>
          {saveError}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          style={{ flex: 1 }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
          style={{ flex: 1, opacity: isSaving ? 0.7 : 1 }}
        >
          Crear tarjeta
        </Button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function CardPicker({
  coupleId,
  value,
  onChange,
}: Readonly<{
  coupleId: string | null;
  value: string | null;
  onChange: (cardId: string | null) => void;
}>) {
  const { data: cards = [] } = useCards(coupleId);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <fieldset style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}>
        <legend className="sr-only">Tarjeta</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-pressed={value === null}
            style={chipStyle(value === null)}
          >
            Sin tarjeta
          </button>
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onChange(card.id)}
              aria-pressed={value === card.id}
              style={chipStyle(value === card.id)}
            >
              {card.name}
            </button>
          ))}
          {!creating && coupleId && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              data-testid="new-card-trigger"
              style={{
                ...chipStyle(false),
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent)",
              }}
            >
              <Plus size={12} aria-hidden="true" />
              Nueva tarjeta
            </button>
          )}
        </div>
      </fieldset>
      {creating && coupleId && (
        <NewCardForm
          coupleId={coupleId}
          onCancel={() => setCreating(false)}
          onCreated={(card) => {
            setCreating(false);
            onChange(card.id);
          }}
        />
      )}
    </div>
  );
}
