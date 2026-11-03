import { describe, expect, it } from "vitest";
import {
  describeError,
  inlineMessage,
  UserFacingError,
} from "../describe-error";

describe("describeError", () => {
  it("shows user-facing errors verbatim and never offers a retry", () => {
    const d = describeError(new UserFacingError("Revisá el monto"));
    expect(d).toMatchObject({
      kind: "validation",
      title: "Revisá el monto",
      message: "",
      code: null,
      retryable: false,
    });
  });

  it("detects network failures from the message", () => {
    const d = describeError(new TypeError("Failed to fetch"));
    expect(d.kind).toBe("offline");
    expect(d.title).toBe("Sin conexión");
    expect(d.retryable).toBe(true);
  });

  it("treats any error as offline when the browser reports no connection", () => {
    expect(describeError(new Error("boom"), { online: false }).kind).toBe(
      "offline",
    );
  });

  it("flags an expired session as not retryable", () => {
    const d = describeError(new Error("No autenticado"));
    expect(d.kind).toBe("session");
    expect(d.retryable).toBe(false);
  });

  it("recognises the production-masked server action error and keeps the digest", () => {
    const err = Object.assign(
      new Error(
        "An error occurred in the Server Components render. The specific message is omitted in production builds",
      ),
      { digest: "1855945275" },
    );
    const d = describeError(err, { fallbackTitle: "No se pudo guardar" });
    expect(d).toMatchObject({
      kind: "server",
      title: "No se pudo guardar",
      code: "1855945275",
      retryable: true,
    });
  });

  it("uses the default title when a masked error has no fallback title", () => {
    const err = new Error("omitted in production builds");
    expect(describeError(err).title).toBe("No pudimos completar la acción");
  });

  it("passes through readable server messages in dev", () => {
    const d = describeError(new Error("No se pudo guardar la compra"));
    expect(d).toMatchObject({
      kind: "known",
      title: "No se pudo guardar la compra",
      retryable: true,
    });
  });

  it("falls back for non-Error throwables", () => {
    const d = describeError("nope");
    expect(d.kind).toBe("server");
    expect(d.retryable).toBe(true);
  });
});

describe("inlineMessage", () => {
  it("returns the title alone for validation and known errors", () => {
    expect(
      inlineMessage(describeError(new UserFacingError("Falta el monto"))),
    ).toBe("Falta el monto");
    expect(
      inlineMessage(describeError(new Error("Ya existe una invitación"))),
    ).toBe("Ya existe una invitación");
  });

  it("joins title and message for server and offline errors", () => {
    const text = inlineMessage(describeError(new Error("Failed to fetch")));
    expect(text).toContain("Sin conexión");
    expect(text).toContain("Revisá tu internet");
  });
});
