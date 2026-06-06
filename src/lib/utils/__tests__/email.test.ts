import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { sendEmail } from "../email";

const OPTS = { to: "user@test.com", subject: "Test", html: "<p>hi</p>" };

describe("sendEmail", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── Dev / test mode ──────────────────────────────────────────────────────────

  it("en entorno no-producción retorna sin llamar fetch", async () => {
    // NODE_ENV es 'test' — nunca llega al switch de providers
    await sendEmail(OPTS);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("en entorno no-producción loguea a consola", async () => {
    await sendEmail(OPTS);
    expect(console.log).toHaveBeenCalledOnce();
  });

  // ── Production branches ───────────────────────────────────────────────────────

  describe("en producción", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.EMAIL_SENDER_ADDRESS = "sender@gastos.app";
      process.env.EMAIL_SENDER_NAME = "Gastos en Pareja";
    });

    afterEach(() => {
      delete process.env.EMAIL_SENDER_ADDRESS;
      delete process.env.EMAIL_SENDER_NAME;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.BREVO_API_KEY;
      delete process.env.RESEND_API_KEY;
    });

    describe("proveedor brevo (default)", () => {
      beforeEach(() => {
        process.env.BREVO_API_KEY = "brevo-test-key";
        vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
      });

      it("llama al endpoint de Brevo", async () => {
        await sendEmail(OPTS);
        const [url] = vi.mocked(fetch).mock.calls[0];
        expect(url).toBe("https://api.brevo.com/v3/smtp/email");
      });

      it("incluye el api-key en los headers", async () => {
        await sendEmail(OPTS);
        const [, init] = vi.mocked(fetch).mock.calls[0];
        const headers = init?.headers as Record<string, string>;
        expect(headers["api-key"]).toBe("brevo-test-key");
      });

      it("lanza error con status cuando el fetch falla", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
          new Response("Bad Request", { status: 400 }),
        );
        await expect(sendEmail(OPTS)).rejects.toThrow("Brevo error (400)");
      });
    });

    describe("proveedor resend", () => {
      beforeEach(() => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test_key";
        vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
      });

      it("llama al endpoint de Resend", async () => {
        await sendEmail(OPTS);
        const [url] = vi.mocked(fetch).mock.calls[0];
        expect(url).toBe("https://api.resend.com/emails");
      });

      it("incluye Authorization Bearer en los headers", async () => {
        await sendEmail(OPTS);
        const [, init] = vi.mocked(fetch).mock.calls[0];
        const headers = init?.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer re_test_key");
      });

      it("lanza error con status cuando el fetch falla", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
          new Response("Unauthorized", { status: 401 }),
        );
        await expect(sendEmail(OPTS)).rejects.toThrow("Resend error (401)");
      });
    });

    it("proveedor desconocido: lanza error descriptivo", async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      await expect(sendEmail(OPTS)).rejects.toThrow(
        'Email provider desconocido: "sendgrid"',
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
