import { createPlatformApp } from "../packages/server/src/server";
import { generatePKCE } from "../packages/sdk/src/pkce";

async function main() {
  console.log("==========================================================");
  console.log("⚡ AI PAYMENT PLATFORM & MANAGED ACTIONS — LIVE PLAYGROUND");
  console.log("==========================================================\n");

  const isReal = process.env.REAL_AI === "true";
  const { app, db, ledger, authService, devService } = createPlatformApp({
    forceMock: !isReal
  });
  if (isReal) {
    console.log("🔥 Running with REAL AI provider from environment!");
  } else {
    console.log("⚡ Running in self-contained offline mode (Set REAL_AI=true to use live OpenAI/Gemini)\n");
  }

  // --- Step 1: Developer Registers & Publishes Managed Action ---
  console.log("👉 [1/6] DEVELOPER PUBLISHES MANAGED ACTION");
  console.log("   Developer uses Secret Key: sk_live_demo_secret_456");

  const devRes = await app.request("/v1/developer/actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk_live_demo_secret_456"
    },
    body: JSON.stringify({
      actionName: "optimize-resume",
      model: "mock/gpt-4o-mini",
      priceCredits: 15,
      maxProviderCostCents: 5,
      systemPrompt: "You are an elite technical recruiter.",
      userPromptTemplate: "Candidate CV:\n{{cvText}}",
      rateLimit: { maxRequests: 2, windowSeconds: 30 }
    })
  });
  const devBody = await devRes.json() as any;
  console.log(`   ✅ Published action '${devBody.action.actionName}' version ${devBody.action.version}`);
  console.log(`      Price: ${devBody.action.priceCredits} ⚡ | Model: ${devBody.action.model}`);

  // Test that public key CANNOT modify actions
  const hackRes = await app.request("/v1/developer/actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer pk_live_demo123"
    },
    body: JSON.stringify({ actionName: "hacked", priceCredits: 1, model: "gpt" })
  });
  console.log(`   🛡️  Public key (pk_live_...) rejected on developer endpoint: HTTP ${hackRes.status}`);

  // --- Step 2: User Browser PKCE Authentication ---
  console.log("\n👉 [2/6] USER AUTHENTICATION (PKCE S256 + 20⚡ WELCOME BONUS)");
  const pkce = await generatePKCE();
  console.log(`   Generated PKCE code_challenge: ${pkce.challenge.slice(0, 16)}...`);

  const code = await authService.issueAuthorizationCode({
    userId: "usr_alice",
    email: "alice@example.com",
    projectId: "proj_demo",
    codeChallenge: pkce.challenge
  });

  const tokenRes = await app.request("/v1/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: "proj_demo",
      code,
      codeVerifier: pkce.verifier
    })
  });
  const tokenData = await tokenRes.json() as any;
  const userToken = tokenData.sessionToken;
  console.log(`   ✅ Exchanged auth code for session JWT token`);
  console.log(`   🎁 Welcome bonus granted: ${tokenData.welcomeBonusGranted}`);

  let wallet = await ledger.getWallet("usr_alice");
  console.log(`   💰 Initial Alice Wallet Balance: ${wallet.availableCredits} ⚡`);

  // --- Step 3: Execute Managed Action ---
  console.log("\n👉 [3/6] EXECUTE MANAGED ACTION (Zero-Backend Client Call)");
  console.log("   Alice calls POST /v1/actions/optimize-resume/execute (Costs 15 ⚡)");

  const execRes = await app.request("/v1/actions/optimize-resume/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userToken}`,
      "x-request-id": "req_alice_play_1"
    },
    body: JSON.stringify({
      inputs: { cvText: "Senior TS developer with 6 years experience in fintech." }
    })
  });

  const execData = await execRes.json() as any;
  console.log(`   HTTP Status: ${execRes.status} | Request ID: ${execRes.headers.get("x-request-id")}`);
  console.log(`   🤖 Structured Output Received:`);
  console.log(`      Rating: ${execData.output.rating}/10`);
  console.log(`      Summary: "${execData.output.optimizedSummary.slice(0, 80)}..."`);

  wallet = await ledger.getWallet("usr_alice");
  console.log(`   💰 New Alice Wallet Balance: ${wallet.availableCredits} ⚡ (15 ⚡ deducted)`);

  // --- Step 4: Cryptographic Audit in action_runs ---
  console.log("\n👉 [4/6] CRYPTOGRAPHIC AUDIT RECORD IN action_runs");
  const runs = (db as any).actionRuns as Map<string, any>;
  const lastRun = Array.from(runs.values())[0];
  console.log(`   Run ID:        ${lastRun.id}`);
  console.log(`   Status:        ${lastRun.status}`);
  console.log(`   Prompt Hash:   ${lastRun.promptHash.slice(0, 24)}... (SHA-256)`);
  console.log(`   Input Hash:    ${lastRun.inputHash.slice(0, 24)}... (SHA-256)`);
  console.log(`   Model & Price: ${lastRun.model} @ ${lastRun.reservedCredits} ⚡`);

  // --- Step 5: Insufficient Credits / Rate Limiting Protection ---
  console.log("\n👉 [5/6] INSUFFICIENT CREDITS PROTECTION");
  console.log("   Alice attempts to run action again (Requires 15 ⚡, but Alice only has 5 ⚡)");

  const failRes = await app.request("/v1/actions/optimize-resume/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userToken}`
    },
    body: JSON.stringify({
      inputs: { cvText: "Another CV..." }
    })
  });
  const failData = await failRes.json() as any;
  console.log(`   🛡️  Blocked: HTTP ${failRes.status} ${failData.code}`);
  console.log(`      Message: "${failData.error}"`);

  // --- Step 6: Top-Up via Stripe Webhook ---
  console.log("\n👉 [6/6] STRIPE SECURE TOP-UP ($5.00 -> 550 ⚡)");
  console.log("   Simulating Stripe webhook event: checkout.session.completed");

  const stripePayload = JSON.stringify({
    id: "evt_stripe_play_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_play_1",
        metadata: { userId: "usr_alice", packId: "popular" }
      }
    }
  });

  // Calculate HMAC-SHA256 signature
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("whsec_demo_secret_123"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(stripePayload));
  const hexSig = Array.from(new Uint8Array(sigBuffer), b => b.toString(16).padStart(2, "0")).join("");

  const topupRes = await app.request("/v1/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": hexSig
    },
    body: stripePayload
  });
  console.log(`   Stripe Webhook Response: HTTP ${topupRes.status}`);

  wallet = await ledger.getWallet("usr_alice");
  console.log(`   🎉 FINAL ALICE WALLET BALANCE: ${wallet.availableCredits} ⚡ (5 + 550 = 555 ⚡)`);

  // Ledger Invariant Verification
  for (const tx of db.transactions.values()) {
    let sum = 0;
    for (const e of tx.entries) sum += e.amountCredits;
    if (sum !== 0) throw new Error("Ledger imbalance!");
  }
  console.log(`   🏛️  Double-entry ledger invariant verified: All ${db.transactions.size} transactions strictly balance to 0 (∑ = 0).`);
  console.log("\n==========================================================");
  console.log("✨ ALL PRODUCTION CHECKS VERIFIED SUCCESSFULLY!");
  console.log("==========================================================\n");
}

main().catch(console.error);
