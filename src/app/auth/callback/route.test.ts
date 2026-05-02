import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "./route";

describe("getSafeNextPath", () => {
  it("retorna /dashboard cuando next es null", () => {
    expect(getSafeNextPath(null)).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next es una URL externa", () => {
    expect(getSafeNextPath("https://evil.example")).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next no empieza con /", () => {
    expect(getSafeNextPath("dashboard")).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next es protocol-relative", () => {
    expect(getSafeNextPath("//evil.example")).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next contiene backslashes", () => {
    expect(getSafeNextPath(String.raw`/\evil`)).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next contiene salto de línea", () => {
    expect(getSafeNextPath("/dashboard\nheader-injection")).toBe("/dashboard");
  });

  it("permite rutas internas absolutas", () => {
    expect(getSafeNextPath("/invite/token-123")).toBe("/invite/token-123");
  });

  it("recorta espacios alrededor de una ruta válida", () => {
    expect(getSafeNextPath("   /dashboard   ")).toBe("/dashboard");
  });

  it("retorna /dashboard cuando next solo tiene espacios", () => {
    expect(getSafeNextPath("   ")).toBe("/dashboard");
  });
});
