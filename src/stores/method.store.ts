import { Method } from "@prisma/client";
import { create } from "zustand";
import axios from "axios";

export interface MethodStore {
  method: Method;
  setMethod: (method: Method) => void;
  methodName: string;
  setMethodName: (methodName: string) => void;
  getMethod: () => Promise<void>;
}

const useMethodStore = create<MethodStore>((set) => ({
  method: {} as Method,
  setMethod: (method) => {
    set({ method });
  },
  methodName: "",
  setMethodName: (methodName) => {
    set({ methodName });
  },
  getMethod: async () => {
    const { data: method } = await axios.get("/api/methods");
    set({ method });
  },
}));

export default useMethodStore;
