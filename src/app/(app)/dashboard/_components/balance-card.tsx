import { Button } from "@/components/ui/button";
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
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {settlements.map((s) => (
        <button
          key={s.id}
          type="button"
          data-testid={`settlement-row-${s.id}`}
          onClick={() => onEdit(s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 4px",
            borderRadius: 8,
            textAlign: "left",
            fontFamily: "var(--font-sans)",
          }}
        >
          <PersonAvatar
            initials={initialsOf(s.from_user_id)}
            person={personOf(s.from_user_id)}
            size="sm"
          />
          <span style={{ fontSize: 12, color: "var(--fg-2)", flex: 1 }}>
            {formatShortDate(s.paid_on)} · {firstName(s.from_user_id)} →{" "}
            {firstName(s.to_user_id)}
            {s.note ? (
              <span style={{ color: "var(--fg-3)" }}> · {s.note}</span>
            ) : null}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--status-success-text)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {formatARS(s.amount)}
          </span>
        </button>
      ))}

      {settlements.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 4,
            paddingTop: 8,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Total liquidado
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
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
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 20,
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, transparent) 0%, color-mix(in srgb, var(--accent) 2%, transparent) 100%)",
          padding: "20px 20px 16px",
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          Balance {formatMonth(month)}
        </h2>
        {hasDebt ? (
          <>
            <div
              data-testid="balance-debt-amount"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                fontWeight: 700,
                color: "var(--status-danger-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {formatARS(remainingDebt)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-2)",
                marginTop: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
              {debtorName} le debe a {creditorName}
            </div>
          </>
        ) : (
          <>
            <div
              data-testid="balance-zero"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                fontWeight: 700,
                color: "var(--status-success-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              $0
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-2)",
                marginTop: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
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
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background:
                "color-mix(in srgb, var(--status-warning-fg) 8%, transparent)",
              color: "var(--status-warning-fg)",
              fontSize: 12,
              lineHeight: 1.45,
              fontFamily: "var(--font-sans)",
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
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
              style={{
                flex: 1,
                background: p.bg,
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <PersonAvatar
                  initials={p.initials}
                  person={p.person}
                  size="sm"
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: p.color,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {p.name} · {p.pct}%
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: p.color,
                }}
              >
                {formatARS(p.amt)}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "var(--border-default)",
            borderRadius: 99,
            height: 6,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${myPct}%`,
              background: "var(--person-a)",
              transition: "width 400ms",
            }}
          />
          <div style={{ flex: 1, background: "var(--person-b)" }} />
        </div>
      </div>
    </div>
  );
}
