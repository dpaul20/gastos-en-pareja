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
    try {
      const { data: method } = await axios.get("/api/methods", {
        withCredentials: true, // This ensures cookies (including session cookies) are sent
      });
      set({ method });
    } catch (error) {
      console.error("Error fetching method:", error);
      // Optional: Handle error state in your store
    }
  },
}));

export default useMethodStore;
