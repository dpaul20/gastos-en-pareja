import { describe, expect, it, vi } from "vitest";

// ── MOCKS ───────────────────────────────────────────────────
// createClient is only called inside queryFn when coupleId is not null.
// We mock it so the module loads without requiring env vars.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

// getCoupleMemberProfiles is a Server Action — it imports next/cache which
// requires the Next.js runtime. Mock the whole module to keep tests in node.
vi.mock("@/lib/actions/couple", () => ({
  getCoupleMemberProfiles: vi.fn(),
}));

import { monthlyDataQueryOptions } from "@/lib/queries/use-monthly-data";

describe("monthlyDataQueryOptions", () => {
  describe("cuando coupleId es null", () => {
    const opts = monthlyDataQueryOptions(null, "2026-05-01");

    it("devuelve enabled: false", () => {
      expect(opts.enabled).toBe(false);
    });

    it("incluye coupleId y month en el queryKey", () => {
      expect(opts.queryKey).toEqual(["monthly-data", null, "2026-05-01"]);
    });

    it("queryFn retorna null sin llamar a Supabase", async () => {
      const result = await opts.queryFn();
      expect(result).toBeNull();
    });
  });

  describe("cuando coupleId tiene valor", () => {
    const opts = monthlyDataQueryOptions("couple-123", "2026-05-01");

    it("devuelve enabled: true", () => {
      expect(opts.enabled).toBe(true);
    });

    it("incluye coupleId y month en el queryKey", () => {
      expect(opts.queryKey).toEqual([
        "monthly-data",
        "couple-123",
        "2026-05-01",
      ]);
    });

    it("staleTime es 0 para que siempre refresque", () => {
      expect(opts.staleTime).toBe(0);
    });
  });

  describe("queryKey es estable entre meses distintos", () => {
    it("meses diferentes producen queryKeys diferentes", () => {
      const a = monthlyDataQueryOptions("c1", "2026-04-01");
      const b = monthlyDataQueryOptions("c1", "2026-05-01");
      expect(a.queryKey).not.toEqual(b.queryKey);
    });

    it("couples diferentes producen queryKeys diferentes", () => {
      const a = monthlyDataQueryOptions("couple-a", "2026-05-01");
      const b = monthlyDataQueryOptions("couple-b", "2026-05-01");
      expect(a.queryKey).not.toEqual(b.queryKey);
    });
  });
});
