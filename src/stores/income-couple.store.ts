import { IncomeCouple } from "@prisma/client";
import axios from "axios";
import { create } from "zustand";

export interface IcomeCoupleStore {
  income: IncomeCouple;
  setIncome: (income: IncomeCouple) => void;
  getIncome: () => Promise<void>;
}

const useIncomeStore = create<IcomeCoupleStore>((set) => ({
  income: {} as IncomeCouple,

  setIncome: (income) => set({ income }),

  getIncome: async () => {
    const { data: incomeCouple } = await axios.get<IncomeCouple>("/api/income");
    set({ income: incomeCouple });
  },
}));

export default useIncomeStore;
