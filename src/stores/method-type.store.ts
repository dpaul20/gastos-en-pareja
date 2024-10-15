import { MethodType } from "@prisma/client";
import { create } from "zustand";

export interface MethodTypeStore {
  methodTypes: MethodType[];
  getMethodTypes: () => void;
}

const useMethodTypeStore = create<MethodTypeStore>((set) => ({
  methodTypes: [],
  getMethodTypes: () => {
    fetch("/api/methods/types")
      .then((res) => res.json())
      .then((data) => {
        set({ methodTypes: data });
      })
      .catch((error) => {
        console.error({ error });
      });
  },
}));

export default useMethodTypeStore;
