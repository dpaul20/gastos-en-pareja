import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold text-purple-800 mb-4">
        Distribuye tus Gastos en Pareja
      </h1>
      <p className="text-xl text-purple-600 mb-8">
        Calcula cómo compartir los gastos de forma justa y eficiente en pareja
      </p>
      <Button
        onClick={onStart}
        className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-200 hover:scale-105"
      >
        Comenzar la Aventura
      </Button>
    </div>
  );
}
