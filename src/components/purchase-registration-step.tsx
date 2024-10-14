import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, HelpCircle } from "lucide-react"

interface PurchaseRegistrationStepProps {
  newPurchase: {
    description: string;
    amount: number;
    installments: number;
    buyer: string;
    paidInstallments: number;
    firstPaymentDate: string;
  };
  editingPurchase: number | null;
  names: { person1: string; person2: string };
  handleNewPurchaseChange: (field: string, value: string | number) => void;
  addPurchase: () => void;
  onViewSummary: () => void;
}

export function PurchaseRegistrationStep({
  newPurchase,
  editingPurchase,
  names,
  handleNewPurchaseChange,
  addPurchase,
  onViewSummary,
}: PurchaseRegistrationStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-purple-800">
        {editingPurchase ? "Editar Compra" : "Registro de Compras"}
      </h2>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Descripción de la compra
            </Label>
            <Input
              id="description"
              placeholder="Ej: Supermercado, Alquiler, etc."
              value={newPurchase.description}
              onChange={(e) =>
                handleNewPurchaseChange("description", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-sm font-medium text-gray-700"
            >
              Monto total
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newPurchase.amount}
                onChange={(e) =>
                  handleNewPurchaseChange("amount", parseFloat(e.target.value))
                }
                className="pl-7"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="installments"
                className="text-sm font-medium text-gray-700 flex items-center"
              >
                Número de cuotas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Número total de pagos en los que se dividirá esta
                        compra.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="installments"
                type="number"
                min="1"
                placeholder="1"
                value={newPurchase.installments}
                onChange={(e) =>
                  handleNewPurchaseChange("installments", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="paidInstallments"
                className="text-sm font-medium text-gray-700 flex items-center"
              >
                Cuotas ya pagadas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Número de cuotas que ya han sido pagadas hasta la
                        fecha.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="paidInstallments"
                type="number"
                min="0"
                max={newPurchase.installments}
                placeholder="0"
                value={newPurchase.paidInstallments}
                onChange={(e) =>
                  handleNewPurchaseChange(
                    "paidInstallments",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="buyer"
              className="text-sm font-medium text-gray-700"
            >
              ¿Quién realizó la compra?
            </Label>
            <Select
              value={newPurchase.buyer}
              onValueChange={(value) =>
                handleNewPurchaseChange("buyer", value)
              }
            >
              <SelectTrigger id="buyer">
                <SelectValue placeholder="Selecciona quién compró" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person1">{names.person1}</SelectItem>
                <SelectItem value="person2">{names.person2}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="firstPaymentDate"
              className="text-sm font-medium text-gray-700 flex items-center"
            >
              Fecha de la primera cuota
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      La fecha en que se realizó o se realizará el primer
                      pago de esta compra.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="flex items-center space-x-2">
              <Calendar className="text-purple-600" />
              <Input
                id="firstPaymentDate"
                type="date"
                value={newPurchase.firstPaymentDate}
                onChange={(e) =>
                  handleNewPurchaseChange(
                    "firstPaymentDate",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <Button
            onClick={addPurchase}
            className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-full shadow-md transform transition duration-200 hover:scale-105"
          >
            {editingPurchase ? "Actualizar Compra" : "Agregar Compra"}
          </Button>
        </CardContent>
      </Card>
      <Button
        onClick={onViewSummary}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
      >
        Ver Resumen
      </Button>
    </div>
  )
}