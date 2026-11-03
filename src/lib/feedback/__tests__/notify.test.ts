import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: toastMock }));

import { notify, haptic } from "../notify";
import type { ErrorDescription } from "@/lib/utils/describe-error";

const vibrate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { vibrate });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function serverError(over: Partial<ErrorDescription> = {}): ErrorDescription {
  return {
    kind: "server",
    title: "No se pudo guardar",
    message: "Probá de nuevo",
    code: "abc123",
    retryable: true,
    ...over,
  };
}

describe("haptic", () => {
  it("vibrates with the pattern of the requested kind", () => {
    haptic("success");
    expect(vibrate).toHaveBeenCalledWith(12);
    haptic("celebrate");
    expect(vibrate).toHaveBeenLastCalledWith([10, 30, 10, 30, 24]);
  });

  it("is a no-op when the device has no vibration support", () => {
    vi.stubGlobal("navigator", {});
    expect(() => haptic("error")).not.toThrow();
    expect(vibrate).not.toHaveBeenCalled();
  });
});

describe("notify", () => {
  it("success shows a toast and vibrates", () => {
    notify.success("Guardado", { description: "Café · $ 1.000" });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Guardado",
      expect.objectContaining({
        description: "Café · $ 1.000",
        duration: 4000,
      }),
    );
    expect(vibrate).toHaveBeenCalledWith(12);
  });

  it("success wires an action button to its handler", () => {
    const onClick = vi.fn();
    notify.success("Eliminado", { action: { label: "Deshacer", onClick } });
    const { action } = toastMock.success.mock.calls[0][1];
    expect(action.label).toBe("Deshacer");
    action.onClick();
    expect(onClick).toHaveBeenCalled();
  });

  it("celebrate uses the celebration style and haptic", () => {
    notify.celebrate("Pago registrado");
    expect(toastMock.success).toHaveBeenCalledWith(
      "Pago registrado",
      expect.objectContaining({ className: "fx-toast-celebrate" }),
    );
    expect(vibrate).toHaveBeenCalledWith([10, 30, 10, 30, 24]);
  });

  it("info does not vibrate", () => {
    notify.info("Dato");
    expect(toastMock.info).toHaveBeenCalled();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("warning stays longer and vibrates", () => {
    notify.warning("Ojo");
    expect(toastMock.warning).toHaveBeenCalledWith(
      "Ojo",
      expect.objectContaining({ duration: 6000 }),
    );
    expect(vibrate).toHaveBeenCalledWith([16, 40, 16]);
  });

  it("error offers retry and copy-code for a retryable error with a digest", () => {
    const onRetry = vi.fn();
    notify.error(serverError(), { onRetry });
    const opts = toastMock.error.mock.calls[0][1];
    expect(opts.action.label).toBe("Reintentar");
    expect(opts.cancel.label).toBe("Copiar código");
    opts.action.onClick();
    expect(onRetry).toHaveBeenCalled();
  });

  it("error omits retry when not retryable and omits copy without a code", () => {
    notify.error(serverError({ retryable: false, code: null }), {
      onRetry: vi.fn(),
    });
    const opts = toastMock.error.mock.calls[0][1];
    expect(opts.action).toBeUndefined();
    expect(opts.cancel).toBeUndefined();
  });

  it("copy-code writes the digest to the clipboard and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { vibrate, clipboard: { writeText } });
    notify.error(serverError());
    toastMock.error.mock.calls[0][1].cancel.onClick();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("abc123"));
    await vi.waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Código copiado",
        expect.anything(),
      ),
    );
  });

  it("copy-code falls back to showing the code when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { vibrate, clipboard: { writeText } });
    notify.error(serverError());
    toastMock.error.mock.calls[0][1].cancel.onClick();
    await vi.waitFor(() =>
      expect(toastMock.info).toHaveBeenCalledWith(
        "Código: abc123",
        expect.anything(),
      ),
    );
  });

  it("dismiss forwards the id", () => {
    notify.dismiss("x");
    expect(toastMock.dismiss).toHaveBeenCalledWith("x");
  });
});
