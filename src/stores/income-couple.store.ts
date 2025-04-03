import { Person } from "@prisma/client";
import axios from "axios";
import { create } from "zustand";

export interface IcomeCoupleStore {
  incomeCouple: Person[] | null;
  setIncomeCouple: (incomeCouple: Person[]) => void;
  getIncomeCouple: () => Promise<void>;
}

const useIncomeCoupleStore = create<IcomeCoupleStore>((set) => ({
  incomeCouple: null,

  setIncomeCouple: (incomeCouple: Person[]) => set({ incomeCouple: incomeCouple }),

  getIncomeCouple: async () => {
    const { data: incomeCouple } = await axios.get<Person[]>("/api/persons");
    set({ incomeCouple: incomeCouple });
  },
}));

export default useIncomeCoupleStore;
