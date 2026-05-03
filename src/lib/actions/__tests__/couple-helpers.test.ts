import { describe, expect, it } from "vitest";
import {
  buildInviteUrl,
  canAcceptInvitationForEmail,
  normalizeInvitationEmail,
} from "@/lib/actions/couple-helpers";

describe("normalizeInvitationEmail", () => {
  it("normaliza el email con trim y minúsculas", () => {
    expect(normalizeInvitationEmail("  TEST@Example.COM  ")).toBe(
      "test@example.com",
    );
  });

  it("retorna string vacío cuando el input está en blanco", () => {
    expect(normalizeInvitationEmail("   ")).toBe("");
  });
});

describe("buildInviteUrl", () => {
  it("usa http en entorno de desarrollo", () => {
    expect(buildInviteUrl("localhost:3000", "dev-token", "development")).toBe(
      "http://localhost:3000/invite/dev-token",
    );
  });

  it("usa https en entorno de producción", () => {
    expect(buildInviteUrl("app.example.com", "prod-token", "production")).toBe(
      "https://app.example.com/invite/prod-token",
    );
  });

  it("usa localhost por defecto cuando no hay host", () => {
    expect(buildInviteUrl(null, "token", "development")).toBe(
      "http://localhost:3000/invite/token",
    );
  });
});

describe("canAcceptInvitationForEmail", () => {
  it("acepta cuando los emails coinciden luego de normalizar", () => {
    expect(
      canAcceptInvitationForEmail(" TEST@example.com ", "test@example.com"),
    ).toBe(true);
  });

  it("rechaza cuando los emails no coinciden", () => {
    expect(canAcceptInvitationForEmail("a@example.com", "b@example.com")).toBe(
      false,
    );
  });

  it("rechaza cuando el email del usuario está vacío", () => {
    expect(canAcceptInvitationForEmail("", "b@example.com")).toBe(false);
  });
});
