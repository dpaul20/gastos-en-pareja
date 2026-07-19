"use client";

import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFixedExpenseInstance } from "@/lib/actions/expenses";
import { getUpcomingDues } from "@/lib/utils/due-dates";
import type { FixedExpenseInstance, UpcomingDue } from "@/lib/utils/due-dates";
import { isBilled, billedFixedAmount } from "@/lib/utils/balance";
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
  // AWAITING_BILL instances have no known amount yet (sin factura) — the
  // dashboard's upcoming-dues list only reflects billed amounts; PR2/PR3
  // wire the "sin factura" row treatment for this widget.
  const amount = isBilled(instance) ? billedFixedAmount(instance) : 0;
  const name = instance.fixed_expense_templates.description;
  const dueLabel = `Día ${due.dueDay}`;

  return (
    <div className="flex items-center justify-between gap-2 border-b [border-color:var(--border-subtle)] py-2.5">
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap [color:var(--fg-1)]">
          {name}
        </div>
        <div className="mt-0.5 text-xs [color:var(--fg-3)]">
          {dueLabel} · {formatARS(amount)}
        </div>
      </div>
      {showPayButton && (
        <button
          onClick={() => onPay(instance.id)}
          disabled={isPaying}
          className={`shrink-0 rounded-[8px] border-none [background-color:var(--accent)] px-3 py-1.5 [font-family:var(--font-sans)] text-xs font-semibold text-white ${isPaying ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
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
    <div className="mb-3">
      <div
        className="mb-1 text-[11px] font-bold tracking-[0.05em] uppercase"
        style={{ color: titleColor }}
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
        <h3 className="mb-2 text-[11px] font-bold tracking-[0.05em] [color:var(--fg-2)] uppercase">
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
