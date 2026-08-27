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
      console.warn(`[OTP] RESEND_API_KEY not set — falling back to console for ${params.to}`);
      console.log(`[OTP] ${params.to} → ${params.code}`);
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: "AI Payments <no-reply@example.com>",
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
