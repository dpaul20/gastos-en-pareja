import { describe, it, expect } from "vitest";
import {
  toastReducer,
  type ToastState,
  type ToastAction,
} from "../toast-provider";

const initialState: ToastState = { toasts: [] };

describe("toastReducer", () => {
  describe("ADD_TOAST", () => {
    it("creates a toast with correct id, variant, and title", () => {
      const action: ToastAction = {
        type: "ADD_TOAST",
        toast: { id: "t1", variant: "success", title: "Saved" },
      };
      const next = toastReducer(initialState, action);
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0]).toMatchObject({
        id: "t1",
        variant: "success",
        title: "Saved",
      });
    });

    it("creates a danger toast with correct variant", () => {
      const action: ToastAction = {
        type: "ADD_TOAST",
        toast: { id: "t2", variant: "danger", title: "Error" },
      };
      const next = toastReducer(initialState, action);
      expect(next.toasts[0].variant).toBe("danger");
    });

    it("accumulates multiple toasts", () => {
      const s1 = toastReducer(initialState, {
        type: "ADD_TOAST",
        toast: { id: "a", variant: "success", title: "First" },
      });
      const s2 = toastReducer(s1, {
        type: "ADD_TOAST",
        toast: { id: "b", variant: "danger", title: "Second" },
      });
      expect(s2.toasts).toHaveLength(2);
      expect(s2.toasts[0].id).toBe("a");
      expect(s2.toasts[1].id).toBe("b");
    });

    it("preserves undo payload on danger toast", () => {
      const onUndo = () => {};
      const action: ToastAction = {
        type: "ADD_TOAST",
        toast: {
          id: "t3",
          variant: "danger",
          title: "Deleted",
          undo: { label: "Deshacer", onUndo },
        },
      };
      const next = toastReducer(initialState, action);
      expect(next.toasts[0].undo?.label).toBe("Deshacer");
      expect(next.toasts[0].undo?.onUndo).toBe(onUndo);
    });
  });

  describe("DISMISS_TOAST", () => {
    it("removes toast by id", () => {
      const state: ToastState = {
        toasts: [
          { id: "x", variant: "success", title: "A" },
          { id: "y", variant: "danger", title: "B" },
        ],
      };
      const next = toastReducer(state, { type: "DISMISS_TOAST", id: "x" });
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].id).toBe("y");
    });

    it("does not affect other toasts when dismissing one", () => {
      const state: ToastState = {
        toasts: [
          { id: "1", variant: "success", title: "First" },
          { id: "2", variant: "success", title: "Second" },
          { id: "3", variant: "danger", title: "Third" },
        ],
      };
      const next = toastReducer(state, { type: "DISMISS_TOAST", id: "2" });
      expect(next.toasts).toHaveLength(2);
      expect(next.toasts.map((t) => t.id)).toEqual(["1", "3"]);
    });

    it("is a no-op when id does not exist", () => {
      const state: ToastState = {
        toasts: [{ id: "a", variant: "success", title: "Exists" }],
      };
      const next = toastReducer(state, { type: "DISMISS_TOAST", id: "nope" });
      expect(next.toasts).toHaveLength(1);
    });
  });
});
