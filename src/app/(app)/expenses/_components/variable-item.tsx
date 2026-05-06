import { Avatar } from "@/components/shared/avatar";
import { formatARS } from "@/lib/utils";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type VariableExpense = MonthlyData["variableExpenses"][number];

export function VariableItem({
  v,
  getPersonInitials,
  getPerson,
}: {
  readonly v: VariableExpense;
  readonly getPersonInitials: (userId: string) => string;
  readonly getPerson: (userId: string) => "a" | "b";
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Avatar
        initials={getPersonInitials(v.user_id)}
        person={getPerson(v.user_id)}
        size="md"
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {v.description}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-3)",
            marginTop: 2,
            fontFamily: "var(--font-sans)",
          }}
        >
          {v.date}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        {formatARS(v.amount)}
      </div>
    </div>
  );
}
