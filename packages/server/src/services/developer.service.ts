import { ActionVersion, PlatformError, PlatformErrorCodes } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export interface ProjectRecord {
  projectId: string;
  name: string;
  publicKey: string;
  secretKey: string;
}

export class DeveloperService {
  private projectsBySecret = new Map<string, ProjectRecord>();
  private projectsById = new Map<string, ProjectRecord>();
  private actionVersions = new Map<string, ActionVersion[]>();

  constructor(private db: InMemoryDatabase) {}

  registerProject(project: ProjectRecord) {
    this.projectsBySecret.set(project.secretKey, project);
    this.projectsById.set(project.projectId, project);
  }

  verifySecret(secretKey: string): ProjectRecord {
    if (!secretKey.startsWith("sk_live_")) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid developer secret key prefix");
    }
    const project = this.projectsBySecret.get(secretKey);
    if (!project) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid developer secret key");
    }
    return project;
  }

  publishActionVersion(projectId: string, input: Partial<ActionVersion> & { actionName: string; model: string; priceCredits: number }): ActionVersion {
    if (!input || !input.actionName || !input.model || typeof input.priceCredits !== "number") {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Missing required action definition fields (actionName, model, priceCredits)");
    }

    if (!Number.isInteger(input.priceCredits) || input.priceCredits <= 0) {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "priceCredits must be a positive integer");
    }

    if (input.maxProviderCostCents !== undefined && input.maxProviderCostCents <= 0) {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "maxProviderCostCents must be a positive number");
    }

    const key = `${projectId}:${input.actionName}`;
    const existing = this.actionVersions.get(key) || [];
    const nextVersion = existing.length + 1;

    const version: ActionVersion = {
      actionName: input.actionName,
      version: nextVersion,
      projectId,
      model: input.model,
      fallbackModel: input.fallbackModel,
      priceCredits: input.priceCredits,
      maxProviderCostCents: input.maxProviderCostCents ?? 10,
      maxOutputTokens: input.maxOutputTokens ?? 1000,
      outputFormat: input.outputFormat ?? "json",
      systemPrompt: input.systemPrompt ?? "",
      userPromptTemplate: input.userPromptTemplate ?? "",
      inputSchema: input.inputSchema ?? { type: "object" },
      outputSchema: input.outputSchema,
      rateLimit: input.rateLimit ?? { maxRequests: 60, windowSeconds: 60 }
    };

    existing.push(version);
    this.actionVersions.set(key, existing);
    return version;
  }

  getActionVersions(projectId: string, actionName: string): ActionVersion[] {
    const key = `${projectId}:${actionName}`;
    return [...(this.actionVersions.get(key) || [])];
  }

  getLatestAction(projectId: string, actionName: string): ActionVersion | null {
    const versions = this.getActionVersions(projectId, actionName);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  getProjectById(projectId: string): ProjectRecord | undefined {
    return this.projectsById.get(projectId);
  }
}
