import { Pencil } from "lucide-react";
import { PersonAvatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS, formatDayMonth } from "@/lib/utils";
import {
  deleteVariableExpense,
  restoreVariableExpense,
} from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";
import { DeleteExpenseButton } from "./delete-expense-button";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type VariableExpense = MonthlyData["variableExpenses"][number];

export function VariableItem({
  v,
  getPersonInitials,
  getPerson,
  onEdit,
}: {
  readonly v: VariableExpense;
  readonly getPersonInitials: (userId: string) => string;
  readonly getPerson: (userId: string) => "a" | "b";
  readonly onEdit?: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-[14px_16px]">
        <PersonAvatar
          initials={getPersonInitials(v.user_id)}
          person={getPerson(v.user_id)}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium [color:var(--fg-1)]">
            {v.description}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-xs [color:var(--fg-3)]">
              {formatDayMonth(v.date)}
            </span>
            {!v.is_shared && (
              <Badge variant="personal" size="sm">
                Personal
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="ds-amount text-[15px] font-semibold [color:var(--fg-1)]">
            {formatARS(v.amount)}
          </span>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(v.id)}
                aria-label="Editar compra"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent px-2 py-1 [font-family:var(--font-sans)] text-xs [color:var(--fg-3)]"
              >
                <Pencil size={14} aria-hidden="true" />
                Editar
              </button>
            )}
            <DeleteExpenseButton
              title="¿Eliminar compra?"
              description={`"${v.description}" se eliminará. Vas a poder deshacer la acción desde el aviso.`}
              successMessage="Compra eliminada"
              onConfirm={async () => {
                const row = await deleteVariableExpense(v.id);
                return row ? () => restoreVariableExpense(row) : undefined;
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
