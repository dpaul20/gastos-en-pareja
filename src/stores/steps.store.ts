import { create } from "zustand";

export interface StepsStore {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const useStepsStore = create<StepsStore>((set) => ({
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
}));

export default useStepsStore;
