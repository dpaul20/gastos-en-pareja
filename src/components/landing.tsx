import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import useStepsStore from "@/stores/steps.store";
import useMethodStore from "@/stores/method.store";
import { useEffect } from "react";
import useIncomeStore from "@/stores/income-couple.store";

export function Landing() {
  const { data: session, status } = useSession();
  const { setCurrentStep, currentStep } = useStepsStore();
  const { method, getMethod } = useMethodStore();
  const { income, getIncome } = useIncomeStore();

  useEffect(() => {
    if (Object.keys(method).length === 0) getMethod();
  }, [method, getMethod]);

  useEffect(() => {
    console.log("income", income);
    if (Object.keys(income).length === 0) getIncome();
  }, [income, getIncome]);

  const onContinue = () => {
    if (!session?.user) {
      setCurrentStep(1);
    } else if (!method) {
      setCurrentStep(2);
    } else if (!income) {
      setCurrentStep(3);
    } else {
      setCurrentStep(5);
    }
  };

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  if (currentStep !== 0) return null;

  if (session?.user) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-purple-800">
          Bienvenido de vuelta, {session.user.name}
        </h1>
        <Button
          onClick={onContinue}
          className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold text-purple-800">
        Bienvenido a la aplicación de distribución de gastos en pareja
      </h1>
      <p className="mb-4">Por favor, inicia sesión para comenzar.</p>
    </div>
  );
}
