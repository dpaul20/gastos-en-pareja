"use client";

import { useState, useEffect, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Calendar, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DarkMode } from "@/components/dark-mode";

// Define the type for a purchase
type Purchase = {
  id: number;
  description: string;
  amount: number;
  installments: number;
  buyer: string;
  paidInstallments: number;
  firstPaymentDate: string;
};

export default function ExpenseDistributionApp() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");
  const [incomes, setIncomes] = useState({ person1: "", person2: "" });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [newPurchase, setNewPurchase] = useState<Purchase>({
    id: 0,
    description: "",
    amount: 0,
    installments: 1,
    buyer: "person1",
    paidInstallments: 0,
    firstPaymentDate: "",
  });
  const [editingPurchase, setEditingPurchase] = useState<number | null>(null);
  const [names, setNames] = useState({
    person1: "Persona 1",
    person2: "Persona 2",
  });
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);

  useEffect(() => {
    const savedMethod = localStorage.getItem("method");
    const savedIncomes = localStorage.getItem("incomes");
    const savedNames = localStorage.getItem("names");
    const savedPurchases = localStorage.getItem("purchases");

    if (savedMethod) setMethod(savedMethod);
    if (savedIncomes) setIncomes(JSON.parse(savedIncomes));
    if (savedNames) setNames(JSON.parse(savedNames));
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
  }, []);

  useEffect(() => {
    localStorage.setItem("method", method);
    localStorage.setItem("incomes", JSON.stringify(incomes));
    localStorage.setItem("names", JSON.stringify(names));
    localStorage.setItem("purchases", JSON.stringify(purchases));
  }, [method, incomes, names, purchases]);

  const handleMethodChange = (value: SetStateAction<string>) => {
    setMethod(value);
    triggerConfetti();
  };

  const handleIncomeChange = (person: string, value: string) => {
    setIncomes({ ...incomes, [person]: value });
  };

  const handleNameChange = (person: string, value: string) => {
    setNames({ ...names, [person]: value });
  };

  const handleNewPurchaseChange = (field: string, value: string | number) => {
    setNewPurchase({ ...newPurchase, [field]: value });
  };

  const addPurchase = () => {
    if (editingPurchase) {
      setPurchases(
        purchases.map((p) =>
          p.id === editingPurchase ? { ...newPurchase, id: editingPurchase } : p
        )
      );
      setEditingPurchase(null);
    } else {
      const newPurchaseWithId = { ...newPurchase, id: Date.now() };
      setPurchases([...purchases, newPurchaseWithId]);
    }
    setNewPurchase({
      id: 0,
      description: "",
      amount: 0,
      installments: 1,
      buyer: "person1",
      paidInstallments: 0,
      firstPaymentDate: "",
    });
    triggerConfetti();
  };

  const editPurchase = (purchase: Purchase) => {
    setNewPurchase(purchase);
    setEditingPurchase(purchase.id);
    setStep(4);
  };

  const deletePurchase = () => {
    if (purchaseToDelete) {
      setPurchases(purchases.filter((p) => p.id !== purchaseToDelete));
      setPurchaseToDelete(null);
    }
  };

  const incrementPaidInstallments = (id: number) => {
    setPurchases(
      purchases.map((p) => {
        if (p.id === id && p.paidInstallments < p.installments) {
          return {
            ...p,
            paidInstallments: p.paidInstallments + 1,
          };
        }
        return p;
      })
    );
  };

  const calculateDistribution = () => {
    const totalIncome =
      parseFloat(incomes.person1) + parseFloat(incomes.person2);
    const percentagePerson1 = parseFloat(incomes.person1) / totalIncome;
    const percentagePerson2 = parseFloat(incomes.person2) / totalIncome;

    return purchases.map((purchase) => ({
      ...purchase,
      distribution: {
        person1:
          method === "proporcional"
            ? purchase.amount * percentagePerson1
            : purchase.amount / 2,
        person2:
          method === "proporcional"
            ? purchase.amount * percentagePerson2
            : purchase.amount / 2,
      },
    }));
  };

  const calculateTotals = () => {
    const distribution = calculateDistribution();
    return distribution.reduce(
      (acc, purchase) => ({
        person1: acc.person1 + purchase.distribution.person1,
        person2: acc.person2 + purchase.distribution.person2,
      }),
      { person1: 0, person2: 0 }
    );
  };

  const calculateMonthlyPayments = () => {
    const distribution = calculateDistribution();
    return distribution.reduce(
      (acc, purchase) => {
        const remainingInstallments = Math.max(
          0,
          purchase.installments - purchase.paidInstallments
        );
        if (remainingInstallments > 0) {
          const monthlyPerson1 =
            purchase.distribution.person1 / purchase.installments;
          const monthlyPerson2 =
            purchase.distribution.person2 / purchase.installments;
          return {
            person1: acc.person1 + monthlyPerson1,
            person2: acc.person2 + monthlyPerson2,
          };
        }
        return acc;
      },
      { person1: 0, person2: 0 }
    );
  };

  const calculateContributionPercentages = () => {
    const totals = calculateTotals();
    const total = totals.person1 + totals.person2;
    if (total === 0) {
      return { person1: "0.00", person2: "0.00" };
    }
    return {
      person1: ((totals.person1 / total) * 100).toFixed(2),
      person2: ((totals.person2 / total) * 100).toFixed(2),
    };
  };

  const calculateLastPaymentDate = (purchase: Purchase) => {
    if (!purchase.firstPaymentDate) return "N/A";
    const firstDate = new Date(purchase.firstPaymentDate);
    const lastDate = new Date(
      firstDate.setMonth(firstDate.getMonth() + purchase.installments - 1)
    );
    return lastDate.toLocaleDateString();
  };

  const calculatePaymentDifference = () => {
    const totals = calculateMonthlyPayments();
    const difference = totals.person1 - totals.person2;
    if (difference > 0) {
      return {
        payer: names.person2,
        receiver: names.person1,
        amount: Math.abs(difference),
      };
    } else if (difference < 0) {
      return {
        payer: names.person1,
        receiver: names.person2,
        amount: Math.abs(difference),
      };
    } else {
      return { payer: null, receiver: null, amount: 0 };
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const sortPurchases = (purchases: Purchase[]) => {
    const activePurchases = purchases.filter(
      (p) => p.paidInstallments < p.installments
    );
    const completedPurchases = purchases.filter(
      (p) => p.paidInstallments >= p.installments
    );
    return [...activePurchases, ...completedPurchases];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl rounded-lg shadow-lg p-6 bg-gray-100 dark:bg-zinc-800">
        <div className="flex justify-end">
          <DarkMode />
        </div>
        {step === 1 && (
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">
              Distribuye tus Gastos en Pareja
            </h1>
            <p className="text-xl text-purple-600 mb-8">
              Calcula cómo compartir los gastos de forma justa y eficiente en
              pareja
            </p>
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
            >
              Comenzar la Aventura
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-center text-purple-800">
              ¿Cómo prefieres compartir los gastos?
            </h2>
            <RadioGroup
              value={method}
              onValueChange={handleMethodChange}
              className="space-y-4"
            >
              <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
                <RadioGroupItem value="igual" id="igual" />
                <span>Para parejas con ingresos similares</span>
              </Label>
              <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
                <RadioGroupItem value="proporcional" id="proporcional" />
                <span>
                  Para parejas con diferencias significativas en ingresos
                </span>
              </Label>
              <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
                <RadioGroupItem value="fondo-comun" id="fondo-comun" />
                <span>Fondo común</span>
              </Label>
            </RadioGroup>
            <Button
              onClick={() => setStep(3)}
              disabled={!method}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-center text-purple-800">
              Registro de Ingresos
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name1" className="text-lg text-purple-700">
                  Nombre de la Persona 1
                </Label>
                <Input
                  id="name1"
                  value={names.person1}
                  onChange={(e) => handleNameChange("person1", e.target.value)}
                  placeholder="Ingrese el nombre"
                  required
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <Label htmlFor="income1" className="text-lg text-purple-700">
                  Ingresos de {names.person1}
                </Label>
                <Input
                  type="number"
                  id="income1"
                  value={incomes.person1}
                  onChange={(e) =>
                    handleIncomeChange("person1", e.target.value)
                  }
                  placeholder="Ingrese el monto"
                  required
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <Label htmlFor="name2" className="text-lg text-purple-700">
                  Nombre de la Persona 2
                </Label>
                <Input
                  id="name2"
                  value={names.person2}
                  onChange={(e) => handleNameChange("person2", e.target.value)}
                  placeholder="Ingrese el nombre"
                  required
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <Label htmlFor="income2" className="text-lg text-purple-700">
                  Ingresos de {names.person2}
                </Label>
                <Input
                  type="number"
                  id="income2"
                  value={incomes.person2}
                  onChange={(e) =>
                    handleIncomeChange("person2", e.target.value)
                  }
                  placeholder="Ingrese el monto"
                  required
                  className="mt-1 block w-full"
                />
              </div>
            </div>
            <Button
              onClick={() => setStep(5)}
              disabled={!incomes.person1 || !incomes.person2}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
            >
              Ver Resumen
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-center text-purple-800">
              Resumen Financiero
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-purple-700">
                  Distribución de Ingresos Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-purple-700">
                    {names.person1}: $
                    {parseFloat(incomes.person1).toFixed(2).toLocaleString()}{" "}
                    {calculateContributionPercentages().person1}% del total
                  </p>
                  <p className="text-lg font-semibold text-pink-600">
                    {names.person2}: ${parseFloat(incomes.person2).toFixed(2)}{" "}
                    {calculateContributionPercentages().person2}% del total
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-purple-700">
                  Distribución de Gastos Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-purple-700">
                    {names.person1}: $
                    {calculateMonthlyPayments().person1.toFixed(2)} por mes (
                    {calculateContributionPercentages().person1}% del total)
                  </p>
                  <p className="text-lg font-semibold text-pink-600">
                    {names.person2}: $
                    {calculateMonthlyPayments().person2.toFixed(2)} por mes (
                    {calculateContributionPercentages().person2}% del total)
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
                {(() => {
                  const { payer, receiver, amount } =
                    calculatePaymentDifference();
                  if (payer && receiver) {
                    return (
                      <p className="text-lg font-semibold">
                        {payer} debe pagar ${amount.toFixed(2)} a {receiver}{" "}
                        para igualar los gastos.
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-lg font-semibold">
                        Los gastos están equilibrados.
                      </p>
                    );
                  }
                })()}
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
                                      onClick={() => deletePurchase()}
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
              onClick={() => setStep(4)}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
            >
              Agregar Compra
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="w-full bg-gray-500 hover:bg-gray-600 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105 mt-4"
            >
              Actualizar Ingresos
            </Button>
          </div>
        )}

        {step === 4 && (
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
                        handleNewPurchaseChange(
                          "amount",
                          parseFloat(e.target.value)
                        )
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
                        handleNewPurchaseChange(
                          "installments",
                          parseInt(e.target.value)
                        )
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
              onClick={() => setStep(5)}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
            >
              Ver Resumen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
