import { Avatar } from "@/components/shared/avatar";
import { formatARS, formatMonth, getInitials } from "@/lib/utils";
import type { MonthlyBalance } from "@/lib/utils/balance";

type Profile = { user_id: string; full_name: string };

export function BalanceCard({
  balance,
  month,
  myProfile,
  partnerProfile,
}: {
  readonly balance: MonthlyBalance;
  readonly month: string;
  readonly myProfile: Profile | undefined;
  readonly partnerProfile: Profile | undefined;
}) {
  const myInitials = myProfile ? getInitials(myProfile.full_name) : "?";
  const partnerInitials = partnerProfile
    ? getInitials(partnerProfile.full_name)
    : "?";
  const myFirstName = myProfile?.full_name.split(" ")[0] ?? "Vos";
  const partnerFirstName =
    partnerProfile?.full_name.split(" ")[0] ?? "Tu pareja";
  const myPct = Math.round((balance.balances[0]?.percentage ?? 0.5) * 100);

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
            "linear-gradient(135deg, rgba(108,92,231,0.07) 0%, rgba(108,92,231,0.02) 100%)",
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
        {balance.debtAmount > 0 ? (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                fontWeight: 700,
                color: "var(--status-danger)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {formatARS(balance.debtAmount)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-2)",
                marginTop: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
              {balance.debtor === balance.balances[0]?.userId
                ? `${myFirstName} le debe a ${partnerFirstName}`
                : `${partnerFirstName} le debe a ${myFirstName}`}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                fontWeight: 700,
                color: "var(--status-success)",
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
              {balance.balances.length === 0
                ? "Registrá los ingresos en Configuración"
                : "Todo equilibrado"}
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            {
              initials: myInitials,
              person: "a" as const,
              name: myFirstName,
              pct: myPct,
              amt: balance.balances[0]?.obligation ?? 0,
              color: "var(--person-a)",
              bg: "var(--person-a-subtle)",
            },
            {
              initials: partnerInitials,
              person: "b" as const,
              name: partnerFirstName,
              pct: 100 - myPct,
              amt: balance.balances[1]?.obligation ?? 0,
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
                <Avatar initials={p.initials} person={p.person} size="sm" />
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
            background: "var(--color-neutral-200)",
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
