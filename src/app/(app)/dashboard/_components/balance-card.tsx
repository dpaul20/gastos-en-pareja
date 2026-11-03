import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonAvatar } from "@/components/shared/avatar";
import { formatARS, formatMonth, getInitials } from "@/lib/utils";
import type { MonthlyBalance } from "@/lib/utils/balance";
import type { SettlementSummary } from "@/lib/utils/settlement";
import type { Database } from "@/types/database";

type Profile = { user_id: string; full_name: string };
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** "10 ago" — a settlement's paid_on date, parsed as local to avoid the UTC
 * off-by-one that `new Date("YYYY-MM-DD")` causes near midnight. */
function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * The settlement ledger (design D3 / mockup "El ledger muestra los dos
 * pagos"): every recorded payment as its own row — never a net. Each row is a
 * button that opens the edit sheet; delete lives inside that sheet.
 */
function SettlementLedger({
  settlements,
  members,
  settledTotal,
  onEdit,
}: {
  readonly settlements: readonly SettlementRow[];
  readonly members: readonly Profile[];
  readonly settledTotal: number;
  readonly onEdit: (settlement: SettlementRow) => void;
}) {
  if (settlements.length === 0) return null;

  const firstName = (id: string): string =>
    members.find((m) => m.user_id === id)?.full_name.split(" ")[0] ?? "Alguien";
  const personOf = (id: string): "a" | "b" =>
    members[0]?.user_id === id ? "a" : "b";
  const initialsOf = (id: string): string => {
    const full = members.find((m) => m.user_id === id)?.full_name;
    return full ? getInitials(full) : "?";
  };

  return (
    <div
      data-testid="settlement-ledger"
      className="mt-3.5 flex flex-col gap-0.5 border-t [border-color:var(--border-subtle)] pt-3"
    >
      {settlements.map((s) => (
        <button
          key={s.id}
          type="button"
          data-testid={`settlement-row-${s.id}`}
          onClick={() => onEdit(s)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border-none bg-transparent px-1 py-[7px] text-left [font-family:var(--font-sans)]"
        >
          <PersonAvatar
            initials={initialsOf(s.from_user_id)}
            person={personOf(s.from_user_id)}
            size="sm"
          />
          <span className="flex-1 text-[12px] [color:var(--fg-2)]">
            {formatShortDate(s.paid_on)} · {firstName(s.from_user_id)} →{" "}
            {firstName(s.to_user_id)}
            {s.note ? (
              <span className="[color:var(--fg-3)]"> · {s.note}</span>
            ) : null}
          </span>
          <span className="ds-amount text-[13px] font-semibold whitespace-nowrap [color:var(--status-success-text)]">
            {formatARS(s.amount)}
          </span>
        </button>
      ))}

      {settlements.length > 1 && (
        <div className="mt-1 flex items-baseline justify-between border-t [border-color:var(--border-subtle)] pt-2">
          <span className="[font-family:var(--font-sans)] text-[12px] font-semibold [color:var(--fg-1)]">
            Total liquidado
          </span>
          <span className="ds-amount text-[13px] font-bold [color:var(--fg-1)]">
            {formatARS(settledTotal)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Avatar + name; the ring says who is paying (coral) and who receives (teal). */
function FlowPerson({
  initials,
  person,
  name,
  role,
}: {
  readonly initials: string;
  readonly person: "a" | "b";
  readonly name: string;
  readonly role: "pays" | "receives";
}) {
  const ring =
    role === "pays" ? "var(--status-danger)" : "var(--status-success)";
  return (
    <div className="flex w-[72px] flex-col items-center gap-1.5">
      <span
        className="rounded-full p-[3px]"
        style={{ boxShadow: `0 0 0 2px ${ring}` }}
      >
        <PersonAvatar initials={initials} person={person} size="xl" />
      </span>
      <span className="max-w-full truncate [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)]">
        {name}
      </span>
    </div>
  );
}

/** Dashed line that flows towards the creditor; static when motion is reduced. */
function FlowArrow() {
  return (
    <div
      aria-hidden
      className="flex min-w-0 flex-1 items-center self-start pt-[29px] [color:var(--fg-3)]"
    >
      <svg height="2" width="100%" className="min-w-0 flex-1 overflow-visible">
        <line
          x1="0"
          y1="1"
          x2="100%"
          y2="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 7"
          className="balance-flow"
        />
      </svg>
      <svg width="10" height="14" viewBox="0 0 10 14" className="-ml-px">
        <path
          d="M2 2l6 5-6 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Stacked bar of the income split; names live in the legend, not the bar. */
function SplitBar({
  aName,
  aPct,
  bName,
}: {
  readonly aName: string;
  readonly aPct: number;
  readonly bName: string;
}) {
  return (
    <div>
      <div
        role="img"
        aria-label={`${aName} ${aPct}%, ${bName} ${100 - aPct}%`}
        className="flex h-2 overflow-hidden rounded-full"
      >
        <div
          style={{ width: `${aPct}%`, backgroundColor: "var(--person-a)" }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: "var(--person-b)" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[12px] font-semibold">
        <span style={{ color: "var(--person-a-text)" }}>
          {aName} {aPct}%
        </span>
        <span style={{ color: "var(--person-b-text)" }}>
          {bName} {100 - aPct}%
        </span>
      </div>
    </div>
  );
}

export function BalanceCard({
  balance,
  summary,
  awaitingBillCount,
  month,
  myProfile,
  partnerProfile,
  settlements,
  onRegisterPayment,
  onEditSettlement,
}: {
  readonly balance: MonthlyBalance;
  /** Balance with settlements layered on (PR6). Drives the headline number:
   * `remainingDebt` is the debt AFTER payments, never `balance.debtAmount`. */
  readonly summary: SettlementSummary;
  /** How many fixed instances are still AWAITING_BILL this month — powers the
   * "faltan N facturas" note that keeps "saldado" from reading as "cerrado". */
  readonly awaitingBillCount: number;
  readonly month: string;
  readonly myProfile: Profile | undefined;
  readonly partnerProfile: Profile | undefined;
  /** Every settlement recorded this month (full rows) — rendered as the
   * ledger. Each row opens the edit sheet via `onEditSettlement`. */
  readonly settlements: readonly SettlementRow[];
  /** Opens the "Registrar pago" sheet. Owned by the dashboard container. */
  readonly onRegisterPayment: () => void;
  /** Opens the edit sheet for a ledger row. */
  readonly onEditSettlement: (settlement: SettlementRow) => void;
}) {
  const myInitials = myProfile ? getInitials(myProfile.full_name) : "?";
  const partnerInitials = partnerProfile
    ? getInitials(partnerProfile.full_name)
    : "?";
  const myFirstName = myProfile?.full_name.split(" ")[0] ?? "Vos";
  const partnerFirstName =
    partnerProfile?.full_name.split(" ")[0] ?? "Tu pareja";
  const myBalance = balance.balances.find(
    (b) => b.userId === myProfile?.user_id,
  );
  const partnerBalance = balance.balances.find(
    (b) => b.userId === partnerProfile?.user_id,
  );
  const myPct = Math.round((myBalance?.percentage ?? 0.5) * 100);

  // The debt is measured against what was ACTUALLY paid (not the month's full
  // shared total): each person should have put `percentage × totalPaid`, and
  // `settlementNet` is exactly `paid - fair` (see calculateMonthlyBalance).
  const totalPaid = balance.balances.reduce((sum, b) => sum + b.actualPaid, 0);
  const pendingShared = Math.max(
    0,
    Math.round(balance.sharedExpensesTotal - totalPaid),
  );
  const shares = [
    {
      person: "a" as const,
      name: myFirstName,
      pct: myPct,
      paid: myBalance?.actualPaid ?? 0,
      fair: (myBalance?.percentage ?? 0.5) * totalPaid,
      diff: myBalance?.settlementNet ?? 0,
    },
    {
      person: "b" as const,
      name: partnerFirstName,
      pct: 100 - myPct,
      paid: partnerBalance?.actualPaid ?? 0,
      fair: (partnerBalance?.percentage ?? 0.5) * totalPaid,
      diff: partnerBalance?.settlementNet ?? 0,
    },
  ];

  // Headline keys off the settlement-aware NET position, not the raw expense
  // debt — a fully-paid month reads $0 even though expenses created a debt,
  // and an OVERpaid month flips direction ("le debe" swaps) instead of hiding
  // the reversed debt behind $0 (design D3: settlements pay down, never
  // rewrite, the balance; `net` carries the flip — see settlement.ts).
  const net = summary.net;
  // Guard on the ROUNDED amount so a sub-peso residue (which formatARS would
  // render as "$0") reads as settled, not as a "$0 le debe" artifact.
  const hasDebt = net !== null && Math.round(net.amount) > 0;
  const isSettled = !hasDebt && summary.entries.length > 0;
  const debtorIsMe = net?.debtor === myProfile?.user_id;
  const debtorName = debtorIsMe ? myFirstName : partnerFirstName;
  const creditorName =
    net?.creditor === myProfile?.user_id ? myFirstName : partnerFirstName;
  const awaitingNote =
    awaitingBillCount === 1
      ? "Falta 1 factura. Cuando llegue puede aparecer una diferencia."
      : `Faltan ${awaitingBillCount} facturas. Cuando lleguen puede aparecer una diferencia.`;

  return (
    <Card className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]">
      <div
        className="px-5 pt-6 pb-5"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 70%)",
        }}
      >
        <h2 className="m-0 text-center [font-family:var(--font-sans)] text-[12px] font-semibold tracking-[0.08em] [color:var(--fg-2)] uppercase">
          Balance {formatMonth(month)}
        </h2>
        {hasDebt ? (
          <div className="mt-5 flex flex-col items-center">
            <div className="flex w-full items-start justify-between gap-2">
              <FlowPerson
                initials={debtorIsMe ? myInitials : partnerInitials}
                person={debtorIsMe ? "a" : "b"}
                name={debtorName}
                role="pays"
              />
              <FlowArrow />
              <FlowPerson
                initials={debtorIsMe ? partnerInitials : myInitials}
                person={debtorIsMe ? "b" : "a"}
                name={creditorName}
                role="receives"
              />
            </div>
            <div
              data-testid="balance-debt-amount"
              className="balance-rise ds-amount mt-5 text-[48px] leading-none font-bold [letter-spacing:-0.03em] [color:var(--fg-1)]"
            >
              {formatARS(net?.amount ?? 0)}
            </div>
            <p className="m-0 mt-2 [font-family:var(--font-sans)] text-[14px] [color:var(--fg-2)]">
              {debtorName} le debe a {creditorName}
            </p>
            <div className="mt-4 flex w-full items-baseline justify-between gap-3 border-t [border-color:var(--border-subtle)] pt-3 [font-family:var(--font-sans)]">
              <span className="text-[13px] [color:var(--fg-2)]">
                Total pagado entre los dos
              </span>
              <span
                data-testid="balance-total-paid"
                className="ds-amount text-[16px] font-bold [color:var(--fg-1)]"
              >
                {formatARS(totalPaid)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center">
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-full [background-color:var(--status-success-subtle)] [color:var(--status-success-text)]"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div
              data-testid="balance-zero"
              className="balance-rise ds-amount mt-4 text-[48px] leading-none font-bold [letter-spacing:-0.03em] [color:var(--fg-1)]"
            >
              $0
            </div>
            <p className="m-0 mt-2 [font-family:var(--font-sans)] text-[14px] [color:var(--fg-2)]">
              {isSettled
                ? "Saldado 🎉"
                : balance.balances.length === 0
                  ? "Registrá los ingresos en Configuración"
                  : "Todo equilibrado"}
            </p>
            {!isSettled && balance.balances.length === 0 && (
              <Link
                href="/settings"
                className="press mt-4 inline-flex h-10 items-center gap-1.5 rounded-full [background-color:var(--accent-subtle)] px-5 text-sm font-semibold [color:var(--accent)] no-underline"
              >
                Cargar ingresos
                <ArrowRight size={16} aria-hidden />
              </Link>
            )}
          </div>
        )}

        {awaitingBillCount > 0 && (
          <div
            data-testid="balance-awaiting-note"
            role="status"
            className="mt-3 rounded-[10px] px-3 py-[10px] [font-family:var(--font-sans)] text-[12px] leading-[1.45] [color:var(--status-warning-fg)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--status-warning-fg) 8%, transparent)",
            }}
          >
            {awaitingNote}
          </div>
        )}

        {hasDebt && (
          <Button
            type="button"
            data-testid="register-payment"
            onClick={onRegisterPayment}
            className="mt-6 h-12 w-full rounded-[var(--radius-lg)] text-[15px] font-semibold"
          >
            Registrar pago
          </Button>
        )}

        <SettlementLedger
          settlements={settlements}
          members={[myProfile, partnerProfile].filter(Boolean) as Profile[]}
          settledTotal={summary.settledTotal}
          onEdit={onEditSettlement}
        />
      </div>
      <details
        data-testid="balance-breakdown"
        className="group border-t [border-color:var(--border-subtle)] px-5 py-4 [font-family:var(--font-sans)]"
      >
        <summary className="flex min-h-6 cursor-pointer list-none items-center justify-center gap-1.5 text-[13px] font-semibold [color:var(--fg-2)] [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">¿De dónde sale este monto?</span>
          <span className="hidden group-open:inline">Ocultar detalle</span>
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-transform group-open:rotate-180"
          >
            <path
              d="M3 5.5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <SplitBar aName={myFirstName} aPct={myPct} bName={partnerFirstName} />
          <p className="m-0 text-[12px] leading-[1.45] [color:var(--fg-2)]">
            Cada uno tiene que poner su porcentaje según lo que gana.
          </p>
          <div className="flex flex-col gap-3">
            {shares.map((p) => (
              <div
                key={p.person}
                data-testid={`balance-person-${p.person}`}
                className="rounded-[var(--radius-md)] p-3"
                style={{
                  backgroundColor: `var(--person-${p.person}-subtle)`,
                }}
              >
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: `var(--person-${p.person}-text)` }}
                >
                  {p.name} ({p.pct}%)
                </div>
                <dl className="m-0 mt-2 flex flex-col gap-1 text-[13px] [color:var(--fg-2)]">
                  <div className="flex justify-between">
                    <dt>Le tocaba poner</dt>
                    <dd className="ds-amount m-0">{formatARS(p.fair)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Puso</dt>
                    <dd className="ds-amount m-0">{formatARS(p.paid)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t [border-color:var(--border-default)] pt-1.5 font-semibold [color:var(--fg-1)]">
                    <dt>{p.diff < 0 ? "Le falta" : "Puso de más"}</dt>
                    <dd
                      className="ds-amount m-0"
                      style={{
                        color:
                          p.diff < 0
                            ? "var(--status-danger-text)"
                            : "var(--status-success-text)",
                      }}
                    >
                      {formatARS(Math.abs(p.diff))}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          {summary.settledTotal > 0 && (
            <p className="m-0 text-[13px] leading-[1.45] [color:var(--fg-2)]">
              Ya se registraron pagos por{" "}
              <span className="ds-amount font-semibold">
                {formatARS(summary.settledTotal)}
              </span>
              , por eso la deuda de arriba es la que queda.
            </p>
          )}
          {pendingShared > 0 && (
            <p className="m-0 text-[12px] leading-[1.45] [color:var(--fg-2)]">
              Todavía faltan pagar{" "}
              <span className="ds-amount font-semibold">
                {formatARS(pendingShared)}
              </span>{" "}
              de gastos compartidos. Cuando se paguen se reparten igual y este
              monto puede cambiar.
            </p>
          )}
        </div>
      </details>
    </Card>
  );
}
