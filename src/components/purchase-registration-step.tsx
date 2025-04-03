"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, HelpCircle } from "lucide-react";
import { useState } from "react";
import usePurchaseStore from "@/stores/purchase.store";
import useIncomeCoupleStore from "@/stores/income-couple.store";
import useStepsStore from "@/stores/steps.store";

export function PurchaseRegistrationStep() {
  const { currentStep, setCurrentStep } = useStepsStore();
  const { purchases, setPurchases } = usePurchaseStore();
  const { incomeCouple } = useIncomeCoupleStore();
  const [editingPurchase, setEditingPurchase] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [paidInstallments, setPaidInstallments] = useState(0);
  const [buyer, setBuyer] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState("");

  const addPurchase = () => {
    if (editingPurchase) {
      setPurchases(
        purchases.map((p) =>
          p.id === editingPurchase
            ? { ...newPurchase, id: editingPurchase }
            : p,
        ),
      );
      setEditingPurchase(null);
    } else {
      const newPurchaseWithId = { ...newPurchase, id: Date.now() };
      setPurchases([...purchases, newPurchaseWithId]);
    }
  };

  const onViewSummary = () => {
    setCurrentStep(5);
  };

  if (currentStep !== 4) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-center text-3xl font-semibold text-purple-800">
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="pl-7"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="installments"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                Número de cuotas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="ml-1 h-4 w-4 text-gray-400" />
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
                value={installments}
                onChange={(e) => setInstallments(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="paidInstallments"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                Cuotas ya pagadas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="ml-1 h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Número de cuotas que ya han sido pagadas hasta la fecha.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="paidInstallments"
                type="number"
                min="0"
                max={installments}
                placeholder="0"
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(parseInt(e.target.value))}
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
            <Select value={buyer} onValueChange={(value) => setBuyer(value)}>
              <SelectTrigger id="buyer">
                <SelectValue placeholder="Selecciona quién compró" />
              </SelectTrigger>
              <SelectContent>
                {incomeCouple?.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="firstPaymentDate"
              className="flex items-center text-sm font-medium text-gray-700"
            >
              Fecha de la primera cuota
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      La fecha en que se realizó o se realizará el primer pago
                      de esta compra.
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
                value={firstPaymentDate}
                onChange={(e) =>
                  setFirstPaymentDate(new Date(e.target.value).toISOString())
                }
              />
            </div>
          </div>

          <Button
            onClick={addPurchase}
            className="w-full transform rounded-full bg-purple-600 px-4 py-2 font-bold shadow-md transition duration-200 hover:scale-105 hover:bg-purple-700"
          >
            {editingPurchase ? "Actualizar Compra" : "Agregar Compra"}
          </Button>
        </CardContent>
      </Card>
      <Button
        onClick={onViewSummary}
        className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
      >
        Ver Resumen
      </Button>
    </div>
  );
}
