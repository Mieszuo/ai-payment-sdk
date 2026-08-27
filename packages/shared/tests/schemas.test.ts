// packages/shared/tests/schemas.test.ts
import { describe, it, expect } from "bun:test";
import {
  ActionVersionSchema,
  LedgerEntrySchema,
  LedgerTransactionSchema,
  LedgerTransactionTypeSchema,
  AccountTypes,
  formatAccountIdentifier,
  PlatformError,
  PlatformErrorCodes,
  PKCEChallengeRequestSchema,
  TokenExchangeRequestSchema,
  UserSessionTokenSchema
} from "../src";

describe("Shared Schemas", () => {
  it("validates a well-formed ActionVersion", () => {
    const valid = {
      actionName: "optimize-resume",
      version: 1,
      projectId: "proj_123",
      model: "google/gemini-1.5-flash",
      priceCredits: 15,
      maxProviderCostCents: 5,
      maxOutputTokens: 2000,
      outputFormat: "json",
      systemPrompt: "You are an expert recruiter.",
      userPromptTemplate: "CV: {{cvText}}",
      inputSchema: { type: "object", properties: { cvText: { type: "string" } } }
    };
    const parsed = ActionVersionSchema.parse(valid);
    expect(parsed.actionName).toBe("optimize-resume");
    expect(parsed.priceCredits).toBe(15);
  });

  it("applies default values for ActionVersion optional fields", () => {
    const minimal = {
      actionName: "generate-summary",
      version: 2,
      projectId: "proj_456",
      model: "google/gemini-1.5-flash",
      priceCredits: 10,
      maxProviderCostCents: 2.5,
      systemPrompt: "Summarize text.",
      userPromptTemplate: "Input: {{text}}",
      inputSchema: { type: "object" }
    };
    const parsed = ActionVersionSchema.parse(minimal);
    expect(parsed.maxOutputTokens).toBe(2000);
    expect(parsed.outputFormat).toBe("text");
    expect(parsed.rateLimit).toEqual({ maxRequests: 10, windowSeconds: 3600 });
    expect(parsed.fallbackModel).toBeUndefined();
    expect(parsed.outputSchema).toBeUndefined();
  });

  it("rejects invalid ActionVersion records", () => {
    expect(() =>
      ActionVersionSchema.parse({
        actionName: "",
        version: -1,
        projectId: "p1",
        model: "m1",
        priceCredits: 0,
        maxProviderCostCents: -1,
        systemPrompt: "",
        userPromptTemplate: "",
        inputSchema: {}
      })
    ).toThrow();
  });

  it("validates ledger entry schema", () => {
    const entry = LedgerEntrySchema.parse({
      accountIdentifier: "USER_WALLET:usr_123",
      amountCredits: -15
    });
    expect(entry.amountCredits).toBe(-15);
  });

  it("rejects invalid ledger entry", () => {
    expect(() =>
      LedgerEntrySchema.parse({
        accountIdentifier: "",
        amountCredits: 1.5 // non-integer
      })
    ).toThrow();
  });

  it("validates full ledger transaction with multiple entries", () => {
    const tx = LedgerTransactionSchema.parse({
      idempotencyKey: "tx_idem_001",
      transactionType: "SETTLEMENT",
      referenceId: "ref_execution_999",
      entries: [
        { accountIdentifier: "USER_WALLET:usr_123", amountCredits: -15 },
        { accountIdentifier: "PLATFORM_CLEARING", amountCredits: 15 }
      ]
    });
    expect(tx.idempotencyKey).toBe("tx_idem_001");
    expect(tx.transactionType).toBe("SETTLEMENT");
    expect(tx.entries).toHaveLength(2);
    expect(tx.metadata).toEqual({});
  });

  it("rejects ledger transaction with less than two entries", () => {
    expect(() =>
      LedgerTransactionSchema.parse({
        idempotencyKey: "tx_idem_bad",
        transactionType: "TOPUP",
        entries: [{ accountIdentifier: "USER_WALLET:usr_123", amountCredits: 100 }]
      })
    ).toThrow();
  });

  it("validates all ledger transaction types", () => {
    const validTypes = [
      "TOPUP",
      "BONUS",
      "RESERVATION_HOLD",
      "SETTLEMENT",
      "RESERVATION_RELEASE",
      "REFUND"
    ];
    for (const type of validTypes) {
      expect(LedgerTransactionTypeSchema.parse(type)).toBe(type as any);
    }
    expect(() => LedgerTransactionTypeSchema.parse("UNKNOWN_TYPE")).toThrow();
  });

  it("formats account identifiers correctly", () => {
    expect(formatAccountIdentifier("USER_WALLET", "usr_123")).toBe("USER_WALLET:usr_123");
    expect(formatAccountIdentifier("PLATFORM_CLEARING")).toBe("PLATFORM_CLEARING");
    expect(AccountTypes.DEVELOPER_PAYABLE).toBe("DEVELOPER_PAYABLE");
  });

  it("instantiates PlatformError correctly with code and details", () => {
    const err = new PlatformError(
      PlatformErrorCodes.INSUFFICIENT_CREDITS,
      "Wallet has insufficient balance",
      { balance: 2, required: 10 }
    );
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PlatformError);
    expect(err.name).toBe("PlatformError");
    expect(err.code).toBe("INSUFFICIENT_CREDITS");
    expect(err.message).toBe("Wallet has insufficient balance");
    expect(err.details).toEqual({ balance: 2, required: 10 });
  });

  it("validates auth schemas (PKCE, Token Exchange, Session)", () => {
    const validPKCE = PKCEChallengeRequestSchema.parse({
      projectId: "proj_abc",
      codeChallenge: "E9Melhoa2OwvFrGMTJguCH50cUG509Nm-zW_6me-000",
      redirectUri: "https://example.com/callback"
    });
    expect(validPKCE.projectId).toBe("proj_abc");

    const validExchange = TokenExchangeRequestSchema.parse({
      projectId: "proj_abc",
      code: "auth_code_123",
      codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    });
    expect(validExchange.code).toBe("auth_code_123");

    const validSession = UserSessionTokenSchema.parse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
      projectId: "proj_abc",
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    expect(validSession.email).toBe("user@example.com");

    expect(() =>
      PKCEChallengeRequestSchema.parse({
        projectId: "p",
        codeChallenge: "too-short"
      })
    ).toThrow();
  });
});
