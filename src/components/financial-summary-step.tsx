import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Plus } from "lucide-react"

type Purchase = {
  id: number;
  description: string;
  amount: number;
  installments: number;
  buyer: string;
  paidInstallments: number;
  firstPaymentDate: string;
  distribution?: {
    person1: number;
    person2: number;
  };
};

interface FinancialSummaryStepProps {
  names: { person1: string; person2: string };
  calculateMonthlyPayments: () => { person1: number; person2: number };
  calculateContributionPercentages: () => { person1: string; person2: string };
  calculatePaymentDifference: () => { payer: string | null; receiver: string | null; amount: number };
  purchases: Purchase[];
  calculateDistribution: () => Purchase[];
  sortPurchases: (purchases: Purchase[]) => Purchase[];
  calculateLastPaymentDate: (purchase: Purchase) => string;
  incrementPaidInstallments: (id: number) => void;
  editPurchase: (purchase: Purchase) => void;
  deletePurchase: () => void;
  onAddPurchase: () => void;
  onUpdateIncomes: () => void;
}

export function FinancialSummaryStep({
  names,
  calculateMonthlyPayments,
  calculateContributionPercentages,
  calculatePaymentDifference,
  purchases,
  calculateDistribution,
  sortPurchases,
  calculateLastPaymentDate,
  incrementPaidInstallments,
  editPurchase,
  deletePurchase,
  onAddPurchase,
  onUpdateIncomes,
}: FinancialSummaryStepProps) {
  const monthlyPayments = calculateMonthlyPayments();
  const contributionPercentages = calculateContributionPercentages();
  const paymentDifference = calculatePaymentDifference();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-purple-800">
        Resumen Financiero
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-purple-700">
            Distribución de Gastos Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-purple-700">
              {names.person1}: ${monthlyPayments.person1.toFixed(2)} por mes (
              {contributionPercentages.person1}% del total)
            </p>
            <p className="text-lg font-semibold text-pink-600">
              {names.person2}: ${monthlyPayments.person2.toFixed(2)} por mes (
              
              {contributionPercentages.person2}% del total)
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-purple-700">
            Ajuste de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentDifference.payer && paymentDifference.receiver ? (
            <p className="text-lg font-semibold">
              {paymentDifference.payer} debe pagar ${paymentDifference.amount.toFixed(2)} a {paymentDifference.receiver} para igualar los gastos.
            </p>
          ) : (
            <p className="text-lg font-semibold">Los gastos están equilibrados.</p>
          )}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-purple-800">
          Lista de Compras
        </h3>
        {purchases.length > 0 ? (
          <Table>
            <TableCaption>
              Lista de compras y su distribución
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Compra</TableHead>
                <TableHead className="text-right">Monto Total</TableHead>
                <TableHead className="text-right">Cuotas</TableHead>
                <TableHead className="text-right">
                  Cuotas Pendientes
                </TableHead>
                <TableHead className="text-right">Pago Mensual</TableHead>
                <TableHead className="text-center">
                  Última Cuota
                </TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortPurchases(calculateDistribution()).map((purchase) => {
                const isCompleted =
                  purchase.paidInstallments >= purchase.installments;
                const monthlyPayment =
                  purchase.amount / purchase.installments;
                return (
                  <TableRow
                    key={purchase.id}
                    className={isCompleted ? "text-gray-400" : ""}
                  >
                    <TableCell
                      className={`font-medium ${
                        isCompleted ? "line-through" : ""
                      }`}
                    >
                      {purchase.description}
                    </TableCell>
                    <TableCell className="text-right">
                      ${purchase.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {purchase.installments}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.max(
                        0,
                        purchase.installments - purchase.paidInstallments
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ${monthlyPayment.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateLastPaymentDate(purchase)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            incrementPaidInstallments(purchase.id)
                          }
                          disabled={isCompleted}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">
                            Incrementar cuota pagada
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editPurchase(purchase)}
                        >
                          <Pencil className="h-4 w-4 text-purple-600" />
                          <span className="sr-only">Editar compra</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                              <span className="sr-only">
                                Eliminar compra
                              </span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto
                                eliminará permanentemente la compra.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deletePurchase}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500">
            No hay compras registradas aún.
          </p>
        )}
      </div>
      <Button
        onClick={onAddPurchase}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
      >
        Agregar Compra
      </Button>
      <Button
        onClick={onUpdateIncomes}
        className="w-full bg-gray-500 hover:bg-gray-600 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105 mt-4"
      >
        Actualizar Ingresos
      </Button>
    </div>
  )
}