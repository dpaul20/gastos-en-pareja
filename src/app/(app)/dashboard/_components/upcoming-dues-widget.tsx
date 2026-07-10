"use client";

import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFixedExpenseInstance } from "@/lib/actions/expenses";
import { getUpcomingDues } from "@/lib/utils/due-dates";
import type { FixedExpenseInstance, UpcomingDue } from "@/lib/utils/due-dates";
import { effectiveFixedAmount } from "@/lib/utils/balance";
import { formatARS } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

interface DueItemProps {
  readonly due: UpcomingDue;
  readonly showPayButton: boolean;
  readonly onPay: (id: string) => void;
  readonly isPaying: boolean;
}

function DueItem({ due, showPayButton, onPay, isPaying }: DueItemProps) {
  const { instance } = due;
  const amount = effectiveFixedAmount(instance);
  const name = instance.fixed_expense_templates.description;
  const dueLabel = `Día ${due.dueDay}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
          {dueLabel} · {formatARS(amount)}
        </div>
      </div>
      {showPayButton && (
        <button
          onClick={() => onPay(instance.id)}
          disabled={isPaying}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: isPaying ? "not-allowed" : "pointer",
            opacity: isPaying ? 0.6 : 1,
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
          }}
        >
          Pagar
        </button>
      )}
    </div>
  );
}

interface SectionProps {
  readonly title: ReactNode;
  readonly titleColor: string;
  readonly items: UpcomingDue[];
  readonly showPayButton: boolean;
  readonly onPay: (id: string) => void;
  readonly payingId: string | null;
}

function DueSection({
  title,
  titleColor,
  items,
  showPayButton,
  onPay,
  payingId,
}: SectionProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: titleColor,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {items.map((due) => (
        <DueItem
          key={due.instance.id}
          due={due}
          showPayButton={showPayButton}
          onPay={onPay}
          isPaying={payingId === due.instance.id}
        />
      ))}
    </div>
  );
}

// ── WIDGET ───────────────────────────────────────────────────────────────────

interface UpcomingDuesWidgetProps {
  readonly instances: FixedExpenseInstance[];
  readonly coupleId: string;
  readonly month: string;
}

export function UpcomingDuesWidget({
  instances,
  coupleId,
  month,
}: UpcomingDuesWidgetProps) {
  const queryClient = useQueryClient();
  const today = new Date();

  const {
    today: todayDues,
    upcoming,
    overdue,
  } = getUpcomingDues(instances, today);

  const hasAny =
    todayDues.length > 0 || upcoming.length > 0 || overdue.length > 0;

  const {
    mutate: pay,
    variables: payingVariables,
    isPending,
  } = useMutation({
    mutationFn: (id: string) => toggleFixedExpenseInstance(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-data", coupleId, month],
      });
    },
  });

  if (!hasAny) return null;

  const payingId = isPending ? (payingVariables ?? null) : null;

  return (
    <Card data-testid="upcoming-dues-widget">
      <CardContent className="px-4 pt-4 pb-1">
        <h3
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Servicios
        </h3>

        <DueSection
          title={
            <>
              <span aria-hidden="true">🔴</span> Vence hoy
            </>
          }
          titleColor="var(--accent)"
          items={todayDues}
          showPayButton
          onPay={pay}
          payingId={payingId}
        />
        <DueSection
          title={
            <>
              <span aria-hidden="true">⚠️</span> Vencidos
            </>
          }
          titleColor="var(--status-danger-text)"
          items={overdue}
          showPayButton
          onPay={pay}
          payingId={payingId}
        />
        <DueSection
          title={
            <>
              <span aria-hidden="true">📅</span> Esta semana
            </>
          }
          titleColor="var(--fg-2)"
          items={upcoming}
          showPayButton={false}
          onPay={pay}
          payingId={payingId}
        />
      </CardContent>
    </Card>
  );
}
