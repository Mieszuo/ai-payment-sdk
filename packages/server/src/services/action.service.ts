import { ActionVersion, PlatformError, PlatformErrorCodes } from "@platform/shared";
import { renderPromptTemplate, parseUntrustedOutput, verifyMarginGuard } from "@platform/core";
import { LedgerService } from "./ledger.service";
import { ModelProvider } from "../adapters/model-provider";
import { ActionRunService } from "./run.service";

export interface ActionExecutionParams {
  actionName: string;
  projectId: string;
  userId: string;
  inputs: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ActionExecutionResult {
  output: unknown;
  creditsUsed: number;
  remainingBalance: number;
  runId?: string;
}

export class ActionExecutionService {
  private actionMap = new Map<string, ActionVersion>();

  constructor(
    private ledger: LedgerService,
    private modelProvider: ModelProvider,
    actions: ActionVersion[],
    private runService?: ActionRunService
  ) {
    actions.forEach((a) => this.actionMap.set(`${a.projectId}:${a.actionName}`, a));
  }

  async execute(params: ActionExecutionParams): Promise<ActionExecutionResult> {
    const action = this.actionMap.get(`${params.projectId}:${params.actionName}`);
    if (!action) {
      throw new PlatformError(
        PlatformErrorCodes.ACTION_NOT_FOUND,
        `Action "${params.actionName}" not found`
      );
    }

    const runId = crypto.randomUUID();
    const idempotencyKey = params.idempotencyKey || `run_${runId}`;

    // 1. Reserve credits
    await this.ledger.reserveCredits(
      params.userId,
      action.priceCredits,
      `res_${idempotencyKey}`,
      runId
    );

    try {
      await this.runService?.recordRunReservation({
        runId,
        projectId: params.projectId,
        userId: params.userId,
        actionName: action.actionName,
        actionVersion: action.version,
        model: action.model,
        priceCredits: action.priceCredits,
        systemPrompt: action.systemPrompt,
        userPrompt: action.userPromptTemplate,
        inputs: params.inputs || {},
        idempotencyKey
      });

      // 2. Validate input against required fields if specified
      if (action.inputSchema && typeof action.inputSchema === "object") {
        const schemaObj = action.inputSchema as Record<string, unknown>;
        if (Array.isArray(schemaObj.required)) {
          for (const reqField of schemaObj.required) {
            if (typeof reqField === "string" && (params.inputs[reqField] === undefined || params.inputs[reqField] === null)) {
              throw new PlatformError(
                PlatformErrorCodes.INVALID_INPUT,
                `Missing required input field: "${reqField}"`
              );
            }
          }
        }
      }

      // 3. Build prompt from template
      const prompt = renderPromptTemplate(action.userPromptTemplate, params.inputs || {});

      // 4. Call model provider
      await this.runService?.markRunning(runId);
      const result = await this.modelProvider.generate({
        model: action.model,
        systemPrompt: action.systemPrompt,
        prompt,
        maxTokens: action.maxOutputTokens
      });

      // 5. Verify margin guard
      verifyMarginGuard({
        priceCredits: action.priceCredits,
        maxProviderCostCents: action.maxProviderCostCents,
        estimatedCostCents: result.costCents
      });

      // 6. Parse untrusted output
      const output = action.outputFormat === "json"
        ? parseUntrustedOutput(result.text)
        : result.text;

      // 7. Settle reservation
      await this.ledger.settleReservation(
        params.userId,
        action.priceCredits,
        `set_${idempotencyKey}`,
        runId,
        result.costCents
      );

      await this.runService?.markSucceeded(runId, {
        consumedCredits: action.priceCredits,
        costCents: result.costCents
      });

      const wallet = await this.ledger.getWallet(params.userId);

      return {
        output,
        creditsUsed: action.priceCredits,
        remainingBalance: wallet.availableCredits,
        runId
      };
    } catch (err) {
      await this.runService?.markFailed(runId);
      // On failure, release reservation completely
      await this.ledger.releaseReservation(
        params.userId,
        action.priceCredits,
        `rel_${idempotencyKey}`,
        runId
      );
      throw err;
    }
  }
}
