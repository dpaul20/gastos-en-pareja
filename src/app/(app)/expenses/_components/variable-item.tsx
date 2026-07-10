import { PersonAvatar } from "@/components/shared/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS, formatDayMonth } from "@/lib/utils";
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
    <Card>
      <CardContent className="flex items-center gap-3 p-[14px_16px]">
        <PersonAvatar
          initials={getPersonInitials(v.user_id)}
          person={getPerson(v.user_id)}
          size="md"
        />
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
            {v.description}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
              {formatDayMonth(v.date)}
            </span>
            {!v.is_shared && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Personal
              </span>
            )}
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
      </CardContent>
    </Card>
  );
}
