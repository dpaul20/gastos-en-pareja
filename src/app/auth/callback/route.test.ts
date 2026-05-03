import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// ── MOCKS ───────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      redirect: vi.fn((url: URL | string) => ({
        redirected: true,
        url: url.toString(),
      })),
    },
  };
});

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { GET, getSafeNextPath } from "./route";

// ── HELPERS ─────────────────────────────────────────────────
function makeRequest(url: string) {
  return { url } as NextRequest;
}

const BASE = "http://localhost:3000";

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

// ── GET ──────────────────────────────────────────────────────
describe("GET", () => {
  const mockExchangeCodeForSession = vi.fn();
  const mockCookieStore = { getAll: vi.fn().mockReturnValue([]), set: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
    vi.mocked(createServerClient).mockReturnValue({
      auth: { exchangeCodeForSession: mockExchangeCodeForSession },
    } as never);
  });

  it("redirige a next cuando el code exchange es exitoso", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const req = makeRequest(
      `${BASE}/auth/callback?code=abc123&next=/dashboard`,
    );

    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(`${BASE}/dashboard`);
  });

  it("redirige a /dashboard por defecto cuando next no está presente", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const req = makeRequest(`${BASE}/auth/callback?code=abc123`);

    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(`${BASE}/dashboard`);
  });

  it("redirige a /login?error=auth_failed cuando el exchange falla", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: new Error("invalid"),
    });
    const req = makeRequest(`${BASE}/auth/callback?code=abc123`);

    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${BASE}/login?error=auth_failed`,
    );
  });

  it("redirige a /login?error=auth_failed cuando no hay code", async () => {
    const req = makeRequest(`${BASE}/auth/callback`);

    await GET(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${BASE}/login?error=auth_failed`,
    );
    expect(createServerClient).not.toHaveBeenCalled();
  });
});
