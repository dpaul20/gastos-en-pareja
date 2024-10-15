import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useMethodTypeStore from "@/stores/method-type.store";
import useMethodStore from "@/stores/method.store";
import useStepsStore from "@/stores/steps.store";
import { MethodType } from "@prisma/client";
import { useEffect } from "react";

export function MethodSelectionStep() {
  const { method, setMethodName, setMethod, methodName } = useMethodStore();
  const { setCurrentStep, currentStep } = useStepsStore();
  const { methodTypes, getMethodTypes } = useMethodTypeStore();

  useEffect(() => {
    if (methodTypes.length === 0) getMethodTypes();
  }, [getMethodTypes, methodTypes.length]);

  const handleContinue = () => {
    fetch("/api/methods", {
      method: "POST",
      body: JSON.stringify({ methodName }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("fetch method", { data });
        setMethod(data);
        setCurrentStep(3);
      })
      .catch((error) => {
        console.error({ error });
      });
  };

  const methodTypeSelected = methodTypes.find(
    (type) => type.id === method?.methodTypeId,
  );

  if (currentStep !== 2) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-center text-3xl font-semibold text-purple-800">
        ¿Cómo prefieres compartir los gastos?
      </h2>
      <RadioGroup
        value={methodTypeSelected?.name}
        onValueChange={(methodName) => setMethodName(methodName)}
        className="space-y-4"
      >
        {methodTypes.map((type: MethodType) => (
          <Label
            key={type.id}
            className="flex cursor-pointer items-center space-x-3 rounded-lg p-4 shadow-md transition duration-200"
          >
            <RadioGroupItem value={type.name} id={type.name} />
            <span>{type.description}</span>
          </Label>
        ))}
      </RadioGroup>
      <Button
        onClick={handleContinue}
        disabled={!methodName}
        className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
      >
        Continuar
      </Button>
    </div>
  );
}
