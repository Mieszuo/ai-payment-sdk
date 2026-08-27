import { DeveloperService } from "./developer.service";

export class CorsPolicyService {
  constructor(private devService: DeveloperService) {}

  isOriginAllowed(origin: string | undefined, projectId: string): boolean {
    if (!origin) return true; // server-to-server / non-browser requests
    const project = this.devService.getProjectById(projectId);
    if (!project) return false;
    const allowed = (project as any).allowedDomains as string[] | undefined;
    return Array.isArray(allowed) && allowed.includes(origin);
  }

  /**
   * Fallback used when no x-project-id header is present (e.g. the demo SDK
   * sends projectId only in the body). The origin is allowed if ANY registered
   * project lists it in its allowedDomains.
   */
  isOriginAllowedByAnyProject(origin: string | undefined): boolean {
    if (!origin) return true; // server-to-server / non-browser requests
    return this.devService
      .getAllProjects()
      .some((project) => this.isOriginAllowed(origin, project.projectId));
  }
}
