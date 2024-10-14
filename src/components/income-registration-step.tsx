import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface IncomeRegistrationStepProps {
  names: { person1: string; person2: string };
  incomes: { person1: string; person2: string };
  onNameChange: (person: string, value: string) => void;
  onIncomeChange: (person: string, value: string) => void;
  onContinue: () => void;
}

export function IncomeRegistrationStep({
  names,
  incomes,
  onNameChange,
  onIncomeChange,
  onContinue,
}: IncomeRegistrationStepProps) {
  return (
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
            onChange={(e) => onNameChange("person1", e.target.value)}
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
            onChange={(e) => onIncomeChange("person1", e.target.value)}
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
            onChange={(e) => onNameChange("person2", e.target.value)}
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
            onChange={(e) => onIncomeChange("person2", e.target.value)}
            placeholder="Ingrese el monto"
            required
            className="mt-1 block w-full"
          />
        </div>
      </div>
      <Button
        onClick={onContinue}
        disabled={!incomes.person1 || !incomes.person2}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
      >
        Ver Resumen
      </Button>
    </div>
  )
}