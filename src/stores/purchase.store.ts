import { Purchase } from "@prisma/client";
import axios from "axios";
import { create } from "zustand";

export interface PurchaseStore {
  purchases: Purchase[];
  setPurchases: (purchases: Purchase[]) => void;
  getPurchase: () => Promise<void>;
}

const usePurchaseStore = create<PurchaseStore>((set) => ({
  purchases: [],
  setPurchases: (purchases: Purchase[]) => set({ purchases }),
  getPurchase: async () => {
    const { data: purchases } = await axios.get<Purchase[]>("/api/purchases");
    set({ purchases });
  },
}));

export default usePurchaseStore;
