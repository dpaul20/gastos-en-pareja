"use client";
import { Button } from "@/components/ui/button";
import useStepsStore from "@/stores/steps.store";

export function WelcomeStep() {
  const { setCurrentStep, currentStep } = useStepsStore();

  if (currentStep !== 1) return null;

  return (
    <div className="space-y-6 text-center">
      <h1 className="mb-4 text-4xl font-bold text-purple-800">
        Distribuye tus Gastos en Pareja
      </h1>
      <p className="mb-8 text-xl text-purple-600">
        Calcula cómo compartir los gastos de forma justa y eficiente en pareja
      </p>
      <Button
        onClick={() => setCurrentStep(2)}
        className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
      >
        Comenzar la Aventura
      </Button>
    </div>
  );
}
