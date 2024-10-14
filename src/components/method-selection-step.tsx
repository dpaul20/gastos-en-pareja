import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MethodSelectionStepProps {
  method: string;
  onMethodChange: (value: string) => void;
  onContinue: () => void;
}

export function MethodSelectionStep({
  method,
  onMethodChange,
  onContinue,
}: MethodSelectionStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-purple-800">
        ¿Cómo prefieres compartir los gastos?
      </h2>
      <RadioGroup
        value={method}
        onValueChange={onMethodChange}
        className="space-y-4"
      >
        <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
          <RadioGroupItem value="igual" id="igual" />
          <span>Para parejas con ingresos similares</span>
        </Label>
        <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
          <RadioGroupItem value="proporcional" id="proporcional" />
          <span>Para parejas con diferencias significativas en ingresos</span>
        </Label>
        <Label className="flex items-center space-x-3 p-4 rounded-lg shadow-md cursor-pointer transition duration-200">
          <RadioGroupItem value="fondo-comun" id="fondo-comun" />
          <span>Fondo común</span>
        </Label>
      </RadioGroup>
      <Button
        onClick={onContinue}
        disabled={!method}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
      >
        Continuar
      </Button>
    </div>
  );
}
