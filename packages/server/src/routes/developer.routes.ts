import { Hono } from "hono";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { DeveloperService } from "../services/developer.service";
import { correlationMiddleware, getCorrelationContext } from "../observability/correlation";

export function createDeveloperRoutes(devService: DeveloperService) {
  const router = new Hono();
  router.use("*", correlationMiddleware());

  router.post("/actions", async (c) => {
    try {
      const auth = c.req.header("Authorization");
      if (!auth?.startsWith("Bearer ")) {
        throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing developer authorization header");
      }

      const token = auth.replace("Bearer ", "");
      const project = devService.verifySecret(token);

      const correlation = getCorrelationContext(c);
      correlation.projectId = project.projectId;

      const body = await c.req.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Malformed or missing JSON request body");
      }

      const action = devService.publishActionVersion(project.projectId, body);
      correlation.actionName = action.actionName;

      return c.json({ action }, 201);
    } catch (err: any) {
      if (err instanceof PlatformError) {
        const status = err.code === PlatformErrorCodes.UNAUTHORIZED ? 401 : 400;
        return c.json({ error: err.message, code: err.code }, status);
      }
      return c.json({ error: err.message || "Internal server error" }, 500);
    }
  });

  router.get("/actions/:name", async (c) => {
    try {
      const auth = c.req.header("Authorization");
      if (!auth?.startsWith("Bearer ")) {
        throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing developer authorization header");
      }
      const token = auth.replace("Bearer ", "");
      const project = devService.verifySecret(token);
      const actionName = c.req.param("name");

      const correlation = getCorrelationContext(c);
      correlation.projectId = project.projectId;
      correlation.actionName = actionName;

      const versions = devService.getActionVersions(project.projectId, actionName);
      return c.json({ versions });
    } catch (err: any) {
      if (err instanceof PlatformError) {
        const status = err.code === PlatformErrorCodes.UNAUTHORIZED ? 401 : 400;
        return c.json({ error: err.message, code: err.code }, status);
      }
      return c.json({ error: err.message || "Internal server error" }, 500);
    }
  });

  return router;
}
