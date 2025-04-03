import { WelcomeStep } from "@/components/welcome-step";
import { MethodSelectionStep } from "@/components/method-selection-step";
import { IncomeRegistrationStep } from "@/components/income-registration-step";
import { FinancialSummaryStep } from "@/components/financial-summary-step";
import { PurchaseRegistrationStep } from "@/components/purchase-registration-step";
import { Landing } from "@/components/landing";

export default function ExpenseDistributionApp() {
  return (
    <>
      <Landing />

      <WelcomeStep />

      <MethodSelectionStep />

      <IncomeRegistrationStep />

      <PurchaseRegistrationStep />

      <FinancialSummaryStep />
    </>
  );
}
