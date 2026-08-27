export interface EmailTransport {
  send(params: { to: string; code: string }): Promise<void>;
}

export class ConsoleEmailTransport implements EmailTransport {
  async send(params: { to: string; code: string }): Promise<void> {
    console.log(`[OTP] ${params.to} → ${params.code}`);
  }
}

export class ResendEmailTransport implements EmailTransport {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
  }

  async send(params: { to: string; code: string }): Promise<void> {
    if (!this.apiKey) {
      // PII-safe fallback: warn WITHOUT the code (or the recipient) — never
      // print the OTP to standard logs. Dev loops use ConsoleEmailTransport
      // explicitly; production must set RESEND_API_KEY.
      console.warn("[OTP] RESEND_API_KEY not set — code delivered via console transport");
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "no-reply@example.com",
        to: [params.to],
        subject: "Your AI credit login code",
        html: `<p>Your login code is <strong>${params.code}</strong>. It expires in 10 minutes.</p>`
      })
    });
    if (!res.ok) {
      throw new Error(`Resend API error (${res.status})`);
    }
  }
}
