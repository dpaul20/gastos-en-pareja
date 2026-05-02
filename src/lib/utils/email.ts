interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

async function sendViaBrevo({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_SENDER_NAME ?? "Gastos en Pareja",
        email: process.env.EMAIL_SENDER_ADDRESS!,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Brevo error (${res.status}): ${body}`);
  }
}

async function sendViaResend({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  const from = `${process.env.EMAIL_SENDER_NAME ?? "Gastos en Pareja"} <${process.env.EMAIL_SENDER_ADDRESS}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Provider-agnostic email sender.
 *
 * In dev:        logs to terminal (no emails sent).
 * In production: dispatches to the provider set in EMAIL_PROVIDER env var.
 *
 * Env vars:
 *   EMAIL_PROVIDER       — "brevo" (default) | "resend"
 *   EMAIL_SENDER_NAME    — display name for the From field
 *   EMAIL_SENDER_ADDRESS — sender email address
 *   BREVO_API_KEY        — required when EMAIL_PROVIDER=brevo
 *   RESEND_API_KEY       — required when EMAIL_PROVIDER=resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n📧 [DEV] Email para ${options.to}\n   Subject: ${options.subject}\n`,
    );
    return;
  }

  const provider = process.env.EMAIL_PROVIDER ?? "brevo";

  switch (provider) {
    case "brevo":
      return sendViaBrevo(options);
    case "resend":
      return sendViaResend(options);
    default:
      throw new Error(
        `Email provider desconocido: "${provider}". Valores válidos: brevo, resend`,
      );
  }
}
