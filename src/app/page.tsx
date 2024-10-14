"use client";

import { useState, useEffect } from "react";
import { DarkMode } from "@/components/dark-mode";
import { WelcomeStep } from "@/components/welcome-step";
import { MethodSelectionStep } from "@/components/method-selection-step";
import { IncomeRegistrationStep } from "@/components/income-registration-step";
import { FinancialSummaryStep } from "@/components/financial-summary-step";
import { PurchaseRegistrationStep } from "@/components/purchase-registration-step";
import confetti from "canvas-confetti";

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

  const handleMethodChange = (value: string) => {
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

  const calculatePaymentDifference = () => {
    const totals = calculateTotals();
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

  const calculateLastPaymentDate = (purchase: Purchase) => {
    if (!purchase.firstPaymentDate) return "N/A";
    const firstDate = new Date(purchase.firstPaymentDate);
    const lastDate = new Date(
      firstDate.setMonth(firstDate.getMonth() + purchase.installments - 1)
    );
    return lastDate.toLocaleDateString();
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
        {step === 1 && <WelcomeStep onStart={() => setStep(2)} />}
        {step === 2 && (
          <MethodSelectionStep
            method={method}
            onMethodChange={handleMethodChange}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <IncomeRegistrationStep
            names={names}
            incomes={incomes}
            onNameChange={handleNameChange}
            onIncomeChange={handleIncomeChange}
            onContinue={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <FinancialSummaryStep
            names={names}
            calculateMonthlyPayments={calculateMonthlyPayments}
            calculateContributionPercentages={calculateContributionPercentages}
            calculatePaymentDifference={calculatePaymentDifference}
            purchases={purchases}
            calculateDistribution={calculateDistribution}
            sortPurchases={sortPurchases}
            calculateLastPaymentDate={calculateLastPaymentDate}
            incrementPaidInstallments={incrementPaidInstallments}
            editPurchase={editPurchase}
            deletePurchase={deletePurchase}
            onAddPurchase={() => setStep(4)}
            onUpdateIncomes={() => setStep(3)}
          />
        )}
        {step === 4 && (
          <PurchaseRegistrationStep
            newPurchase={newPurchase}
            editingPurchase={editingPurchase}
            names={names}
            handleNewPurchaseChange={handleNewPurchaseChange}
            addPurchase={addPurchase}
            onViewSummary={() => setStep(5)}
          />
        )}
      </div>
    </div>
  );
}
