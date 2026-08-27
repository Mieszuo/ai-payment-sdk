# npm Scope Reservation — `@ai-credits/*`

The monorepo packages publish under the `@ai-credits` npm scope:

| Package | Directory |
|---|---|
| `@ai-credits/shared` | `packages/shared` |
| `@ai-credits/core` | `packages/core` |
| `@ai-credits/server` | `packages/server` |
| `@ai-credits/sdk` | `packages/sdk` |
| `@ai-credits/react` | `packages/react` |

Scoped packages can only be published by an npm account that owns the
`ai-credits` org (or the scope, if claimed directly). Reserve the scope
**before** the first publish — this is a one-time, user-executed step.

## 1. Log in to npm

```bash
npm login
```

Log in as the account that should own the scope (typically the org owner or a
publisher added to the org).

## 2. Create the org (or publish a placeholder package)

**Option A — create the org (free, recommended):**

Create the `ai-credits` org at <https://www.npmjs.com/org/create> and add the
publishing accounts as members. The `@ai-credits` scope is then owned by the
org and all future publishes use it.

**Option B — publish a placeholder package first:**

If you prefer to publish before setting up the org, validate and publish a
placeholder from `packages/sdk`:

1. In `packages/sdk/package.json`, temporarily add:

   ```json
   "publishConfig": { "access": "public" }
   ```

2. Validate the publish dry-run:

   ```bash
   bun publish --dry-run
   ```

3. Once the org exists (or the scope is claimed), publish:

   ```bash
   npm publish --access public
   ```

   > Remove the temporary `publishConfig` afterwards unless it should stay.

## 3. Alternative: claim the org name immediately

Even without publishing anything, claiming the org name at
<https://www.npmjs.com/org/create> reserves the `@ai-credits` scope — the
scope is effectively owned by the org from that moment on.

## 4. Publish the five packages

After reservation, all five packages can be published under `@ai-credits/*`
with `access: public`, keeping versions aligned with the monorepo (currently
`0.1.0`). Publish from each package directory:

```bash
bun publish --access public   # or: npm publish --access public
```

Keep the published versions in sync with the monorepo's version bumps so
`workspace:*` resolution and lockfile remain consistent.
