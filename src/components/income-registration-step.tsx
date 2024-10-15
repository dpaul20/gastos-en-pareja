import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useIncomeStore from "@/stores/income-couple.store";
import useStepsStore from "@/stores/steps.store";

export function IncomeRegistrationStep() {
  const { setCurrentStep, currentStep } = useStepsStore();
  const { income, setIncome } = useIncomeStore();

  const onIncomeChange = (person: string, value: string) => {
    setIncome({ ...income, [person]: value });
  };

  const onNameChange = (person: string, value: string) => {
    setIncome({ ...income, [person]: value });
  };

  const handleContinue = () => {
    fetch("/api/income", {
      method: "POST",
      body: JSON.stringify(income),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("fetch income", { data });
        setCurrentStep(4);
      })
      .catch((error) => {
        console.error({ error });
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
            Nombre: {income?.person1 || "Persona 1"}
          </Label>
          <Input
            id="name1"
            value={income.person1}
            onChange={(e) => onNameChange("person1", e.target.value)}
            placeholder="Ingrese el nombre"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="income1" className="text-lg text-purple-700">
            Ingresos de {income?.person1 || "Persona 1"}
          </Label>
          <Input
            type="number"
            id="income1"
            value={income.incomePerson1}
            onChange={(e) => onIncomeChange("incomePerson1", e.target.value)}
            placeholder="Ingrese el monto"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="name2" className="text-lg text-purple-700">
            Nombre: {income?.person2 || "Persona 2"}
          </Label>
          <Input
            id="name2"
            value={income.person2}
            onChange={(e) => onNameChange("person2", e.target.value)}
            placeholder="Ingrese el nombre"
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="income2" className="text-lg text-purple-700">
            Ingresos de {income?.person2 || "Persona 2"}
          </Label>
          <Input
            type="number"
            id="income2"
            value={income.incomePerson2}
            onChange={(e) => onIncomeChange("incomePerson2", e.target.value)}
            placeholder="Ingrese el monto"
            required
            className="mt-1 block w-full"
          />
        </div>
      </div>
      <Button
        onClick={handleContinue}
        disabled={!income}
        className="w-full transform rounded-full bg-purple-600 px-6 py-3 font-bold shadow-lg transition duration-200 hover:scale-105 hover:bg-purple-700"
      >
        Ver Resumen
      </Button>
    </div>
  );
}
