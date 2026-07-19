import { Button } from "@/components/ui/button";
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

  // Headline keys off the settlement-aware remaining debt, not the raw
  // expense debt — a fully-paid month reads $0 even though expenses created a
  // debt (design D3: settlements pay down, never rewrite, the balance).
  const remainingDebt = summary.remainingDebt;
  const hasDebt = remainingDebt > 0;
  const isSettled = !hasDebt && summary.entries.length > 0;
  const debtorName =
    summary.direction?.debtor === myProfile?.user_id
      ? myFirstName
      : partnerFirstName;
  const creditorName =
    summary.direction?.creditor === myProfile?.user_id
      ? myFirstName
      : partnerFirstName;
  const awaitingNote =
    awaitingBillCount === 1
      ? "Falta 1 factura. Cuando llegue puede aparecer una diferencia."
      : `Faltan ${awaitingBillCount} facturas. Cuando lleguen puede aparecer una diferencia.`;

  return (
    <Card className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]">
      <div
        className="px-5 pt-5 pb-4"
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, transparent) 0%, color-mix(in srgb, var(--accent) 2%, transparent) 100%)",
        }}
      >
        <h2 className="m-0 [font-family:var(--font-sans)] text-[11px] font-semibold tracking-[0.05em] [color:var(--accent)] uppercase">
          Balance {formatMonth(month)}
        </h2>
        {hasDebt ? (
          <>
            <div
              data-testid="balance-debt-amount"
              className="ds-amount text-[38px] leading-[1.1] font-bold [letter-spacing:-0.02em] [color:var(--status-danger-text)]"
            >
              {formatARS(remainingDebt)}
            </div>
            <div className="mt-[5px] [font-family:var(--font-sans)] text-[14px] [color:var(--fg-2)]">
              {debtorName} le debe a {creditorName}
            </div>
          </>
        ) : (
          <>
            <div
              data-testid="balance-zero"
              className="ds-amount text-[38px] leading-[1.1] font-bold [letter-spacing:-0.02em] [color:var(--status-success-text)]"
            >
              $0
            </div>
            <div className="mt-[5px] [font-family:var(--font-sans)] text-[14px] [color:var(--fg-2)]">
              {isSettled
                ? "Saldado"
                : balance.balances.length === 0
                  ? "Registrá los ingresos en Configuración"
                  : "Todo equilibrado"}
            </div>
          </>
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
            className="mt-3 w-full"
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
      <div className="px-5 py-4">
        <div className="mb-2.5 flex gap-2">
          {[
            {
              initials: myInitials,
              person: "a" as const,
              name: myFirstName,
              pct: myPct,
              amt: myBalance?.obligation ?? 0,
              color: "var(--person-a)",
              bg: "var(--person-a-subtle)",
            },
            {
              initials: partnerInitials,
              person: "b" as const,
              name: partnerFirstName,
              pct: 100 - myPct,
              amt: partnerBalance?.obligation ?? 0,
              color: "var(--person-b)",
              bg: "var(--person-b-subtle)",
            },
          ].map((p) => (
            <div
              key={p.person}
              className="flex-1 rounded-[var(--radius-md)] px-3 py-[10px]"
              style={{ backgroundColor: p.bg }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <PersonAvatar
                  initials={p.initials}
                  person={p.person}
                  size="sm"
                />
                <span
                  className="[font-family:var(--font-sans)] text-[12px] font-semibold"
                  style={{ color: p.color }}
                >
                  {p.name} · {p.pct}%
                </span>
              </div>
              <div
                className="ds-amount text-[18px] font-bold"
                style={{ color: p.color }}
              >
                {formatARS(p.amt)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full [background-color:var(--border-default)]">
          <div
            className="[background-color:var(--person-a)] transition-[width] duration-[400ms]"
            style={{ width: `${myPct}%` }}
          />
          <div className="flex-1 [background-color:var(--person-b)]" />
        </div>
      </div>
    </Card>
  );
}
