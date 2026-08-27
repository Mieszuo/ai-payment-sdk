import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { PlatformError } from "@platform/shared";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { DeveloperService } from "../src/services/developer.service";
import { createDeveloperRoutes } from "../src/routes/developer.routes";

describe("Developer Action Registry Management", () => {
  let db: InMemoryDatabase;
  let devService: DeveloperService;
  let app: Hono;

  beforeEach(() => {
    db = new InMemoryDatabase();
    devService = new DeveloperService(db);
    // Seed project with public key and developer secret
    devService.registerProject({
      projectId: "proj_dev_1",
      name: "Resume App",
      publicKey: "pk_live_123",
      secretKey: "sk_live_secret_456"
    });

    devService.registerProject({
      projectId: "proj_dev_2",
      name: "Doc App",
      publicKey: "pk_live_789",
      secretKey: "sk_live_secret_999"
    });

    app = new Hono();
    app.route("/v1/developer", createDeveloperRoutes(devService));
  });

  it("publishes immutable action version with valid developer secret key", async () => {
    const res = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "generate-cover-letter",
        model: "openai/gpt-4o-mini",
        priceCredits: 20,
        maxProviderCostCents: 6,
        systemPrompt: "You are a professional cover letter writer.",
        userPromptTemplate: "Write for {{company}}: {{details}}"
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.action.version).toBe(1);
    expect(body.action.projectId).toBe("proj_dev_1");
    expect(body.action.actionName).toBe("generate-cover-letter");
    expect(body.action.model).toBe("openai/gpt-4o-mini");
    expect(body.action.priceCredits).toBe(20);
    expect(body.action.maxProviderCostCents).toBe(6);
    expect(body.action.outputFormat).toBe("json");
  });

  it("strictly rejects attempts to publish actions using public pk_live keys", async () => {
    const res = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer pk_live_123"
      },
      body: JSON.stringify({
        actionName: "hack-action",
        model: "openai/gpt-4o",
        priceCredits: 1
      })
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("strictly rejects requests with missing or malformed Authorization headers", async () => {
    // Missing Authorization header
    const res1 = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        actionName: "test-action",
        model: "openai/gpt-4o",
        priceCredits: 10
      })
    });
    expect(res1.status).toBe(401);

    // Non-Bearer scheme
    const res2 = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-action",
        model: "openai/gpt-4o",
        priceCredits: 10
      })
    });
    expect(res2.status).toBe(401);

    // Unknown secret key with sk_live_ prefix
    const res3 = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_unknown_key"
      },
      body: JSON.stringify({
        actionName: "test-action",
        model: "openai/gpt-4o",
        priceCredits: 10
      })
    });
    expect(res3.status).toBe(401);
  });

  it("increments action version sequentially and retrieves full immutable version history", async () => {
    // Publish Version 1
    const res1 = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "summarize-doc",
        model: "openai/gpt-4o-mini",
        priceCredits: 15,
        systemPrompt: "Summarize concisely.",
        userPromptTemplate: "{{document}}"
      })
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json() as any;
    expect(body1.action.version).toBe(1);

    // Publish Version 2
    const res2 = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "summarize-doc",
        model: "openai/gpt-4o",
        priceCredits: 25,
        systemPrompt: "Summarize concisely in bullet points.",
        userPromptTemplate: "{{document}}"
      })
    });
    expect(res2.status).toBe(201);
    const body2 = await res2.json() as any;
    expect(body2.action.version).toBe(2);

    // GET all versions
    const getRes = await app.request("/v1/developer/actions/summarize-doc", {
      method: "GET",
      headers: {
        "Authorization": "Bearer sk_live_secret_456"
      }
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json() as any;
    expect(getBody.versions).toHaveLength(2);
    expect(getBody.versions[0].version).toBe(1);
    expect(getBody.versions[0].priceCredits).toBe(15);
    expect(getBody.versions[1].version).toBe(2);
    expect(getBody.versions[1].priceCredits).toBe(25);
    expect(getBody.versions[1].model).toBe("openai/gpt-4o");
  });

  it("strictly rejects GET requests to retrieve action versions without valid developer secret key", async () => {
    // Rejects pk_live key
    const res1 = await app.request("/v1/developer/actions/generate-cover-letter", {
      method: "GET",
      headers: {
        "Authorization": "Bearer pk_live_123"
      }
    });
    expect(res1.status).toBe(401);

    // Rejects missing auth header
    const res2 = await app.request("/v1/developer/actions/generate-cover-letter", {
      method: "GET"
    });
    expect(res2.status).toBe(401);
  });

  it("isolates action versions between projects (multi-tenancy)", async () => {
    // Project 1 publishes action "analyze"
    await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "analyze",
        model: "openai/gpt-4o-mini",
        priceCredits: 10
      })
    });

    // Project 2 publishes action "analyze" with different config
    await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_999"
      },
      body: JSON.stringify({
        actionName: "analyze",
        model: "anthropic/claude-3-5-sonnet",
        priceCredits: 50
      })
    });

    // Project 1 fetches versions
    const res1 = await app.request("/v1/developer/actions/analyze", {
      method: "GET",
      headers: {
        "Authorization": "Bearer sk_live_secret_456"
      }
    });
    const body1 = await res1.json() as any;
    expect(body1.versions).toHaveLength(1);
    expect(body1.versions[0].projectId).toBe("proj_dev_1");
    expect(body1.versions[0].model).toBe("openai/gpt-4o-mini");

    // Project 2 fetches versions
    const res2 = await app.request("/v1/developer/actions/analyze", {
      method: "GET",
      headers: {
        "Authorization": "Bearer sk_live_secret_999"
      }
    });
    const body2 = await res2.json() as any;
    expect(body2.versions).toHaveLength(1);
    expect(body2.versions[0].projectId).toBe("proj_dev_2");
    expect(body2.versions[0].model).toBe("anthropic/claude-3-5-sonnet");

    // Service getLatestAction checks
    const latestP1 = devService.getLatestAction("proj_dev_1", "analyze");
    expect(latestP1?.model).toBe("openai/gpt-4o-mini");
    const latestP2 = devService.getLatestAction("proj_dev_2", "analyze");
    expect(latestP2?.model).toBe("anthropic/claude-3-5-sonnet");
    const nonExistent = devService.getLatestAction("proj_dev_1", "does-not-exist");
    expect(nonExistent).toBeNull();
  });

  it("returns HTTP 400 when body is malformed JSON or missing required fields", async () => {
    // Malformed JSON
    const resMalformed = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: "not-json"
    });
    expect(resMalformed.status).toBe(400);

    // Array JSON body
    const resArray = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify([{ actionName: "array-test" }])
    });
    expect(resArray.status).toBe(400);

    // Missing actionName
    const resNoName = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        priceCredits: 10
      })
    });
    expect(resNoName.status).toBe(400);

    // Missing model
    const resNoModel = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        priceCredits: 10
      })
    });
    expect(resNoModel.status).toBe(400);

    // Missing priceCredits
    const resNoCredits = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        model: "openai/gpt-4o"
      })
    });
    expect(resNoCredits.status).toBe(400);
  });

  it("returns HTTP 400 when priceCredits is <= 0 or non-integer, or maxProviderCostCents is <= 0", async () => {
    // priceCredits = 0
    const resZero = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        model: "openai/gpt-4o",
        priceCredits: 0
      })
    });
    expect(resZero.status).toBe(400);

    // priceCredits = -5
    const resNeg = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        model: "openai/gpt-4o",
        priceCredits: -5
      })
    });
    expect(resNeg.status).toBe(400);

    // priceCredits is float (non-integer)
    const resFloat = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        model: "openai/gpt-4o",
        priceCredits: 10.5
      })
    });
    expect(resFloat.status).toBe(400);

    // maxProviderCostCents <= 0
    const resNegCost = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "test-act",
        model: "openai/gpt-4o",
        priceCredits: 10,
        maxProviderCostCents: -1
      })
    });
    expect(resNegCost.status).toBe(400);
  });

  it("preserves fallbackModel and outputSchema in the published action version", async () => {
    const res = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "structured-extract",
        model: "openai/gpt-4o",
        fallbackModel: "openai/gpt-4o-mini",
        priceCredits: 15,
        outputSchema: {
          type: "object",
          properties: {
            summary: { type: "string" }
          }
        }
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.action.fallbackModel).toBe("openai/gpt-4o-mini");
    expect(body.action.outputSchema).toEqual({
      type: "object",
      properties: {
        summary: { type: "string" }
      }
    });
  });
});
