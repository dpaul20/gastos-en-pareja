"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useIncomeCoupleStore from "@/stores/income-couple.store";
import useStepsStore from "@/stores/steps.store";
import { useState, useEffect } from "react";

export function IncomeRegistrationStep() {
  const { setCurrentStep, currentStep } = useStepsStore();
  const { incomeCouple, setIncomeCouple } = useIncomeCoupleStore();
  const [income1, setIncome1] = useState<number | string>("");
  const [income2, setIncome2] = useState<number | string>("");

  useEffect(() => {
    if (incomeCouple) {
      setIncome1(incomeCouple[0].income);
      setIncome2(incomeCouple[1].income);
    }
  }, [incomeCouple]);

  const handleContinue = () => {
    if (!incomeCouple) return;

    const updatedIncomeCouple = [
      { ...incomeCouple[0], income: Number(income1) },
      { ...incomeCouple[1], income: Number(income2) },
    ];

    setIncomeCouple(updatedIncomeCouple);

    fetch("/api/persons", {
      method: "POST",
      body: JSON.stringify(updatedIncomeCouple),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("fetch income", { data });
        setIncomeCouple(data);
        setCurrentStep(4);
      })
      .catch((error) => {
        console.error("Error fetching income data:", error);
      });
  };

  if (currentStep !== 3) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-center text-3xl font-semibold text-purple-800">
        Registro de Ingresos
      </h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name1" className="text-lg text-purple-700">
            Nombre: {incomeCouple?.[0]?.name || "Persona 1"}
          </Label>
          <Input
            id="name1"
            value={incomeCouple?.[0]?.name || ""}
            disabled
            placeholder="Ingrese el nombre"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="income1" className="text-lg text-purple-700">
            Ingresos de {incomeCouple?.[0]?.name || "Persona 1"}
          </Label>
          <Input
            type="number"
            id="income1"
            value={income1}
            onChange={(e) => setIncome1(e.target.value)}
            placeholder="Ingrese el monto"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="name2" className="text-lg text-purple-700">
            Nombre: {incomeCouple?.[1]?.name || "Persona 2"}
          </Label>
          <Input
            id="name2"
            value={incomeCouple?.[1]?.name || ""}
            disabled
            placeholder="Ingrese el nombre"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="income2" className="text-lg text-purple-700">
            Ingresos de {incomeCouple?.[1]?.name || "Persona 2"}
          </Label>
          <Input
            type="number"
            id="income2"
            value={income2}
            onChange={(e) => setIncome2(e.target.value)}
            placeholder="Ingrese el monto"
            required
            className="mt-1 block w-full"
          />
        </div>
      </div>
      <Button
        onClick={handleContinue}
        disabled={!income1 || !income2}
        className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
      >
        Ver Resumen
      </Button>
    </div>
  );
}
