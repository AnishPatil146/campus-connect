# Root Cause Analysis: Next.js Production Build Hang/Failure

## Problem Description
During production builds on Vercel, the Next.js compilation of `@campus-connect/web` would hang or fail silently immediately after starting the build step. The build process reached:
```
Detected Next.js version: 14.2.35
Running "pnpm build"
> @campus-connect/web@1.0.0 build
> next build
▲ Next.js 14.2.35
```
No additional output would appear.

---

## Technical Investigation & Root Cause

1. **Monorepo Architecture**:
   - The project uses a PNPM monorepo where the web application (`apps/web`) depends on local workspace packages:
     - `@campus-connect/types`
     - `@campus-connect/utils`
     - `@campus-connect/ui`
   - These local packages compile their TypeScript files via `tsc` to a `./dist` folder (configured as their `main` entry point in their respective `package.json` files).

2. **Clean Slate Environment (Vercel)**:
   - On Vercel (and in clean local builds), dependencies are installed, but the package compilation scripts (`tsc`) have not yet been run on the workspace packages. Thus, the `./dist` folders for `@campus-connect/types`, `@campus-connect/utils`, and `@campus-connect/ui` do not exist.

3. **Webpack/Next.js Resolver Hang**:
   - During `next build`, Next.js reads the `transpilePackages` setting in `next.config.mjs` containing the local package names.
   - Webpack attempts to resolve and compile the dependencies from source/entrypoint.
   - Because the `main` field points to `./dist/index.js` which does not exist, and because it is a symlinked monorepo package inside `node_modules`, Webpack's module resolution becomes caught in a loop or hangs indefinitely trying to find the compiled module, causing Vercel builds to stall and time out.

---

## Solution

We updated the `"build"` script of `@campus-connect/web` inside `apps/web/package.json` to ensure the dependent packages are compiled before Next.js starts its build process.

```json
"build": "pnpm --filter @campus-connect/types build && pnpm --filter @campus-connect/utils build && pnpm --filter @campus-connect/ui build && next build"
```

This ensures that:
- Any build script targeting `apps/web` (such as on Vercel) first builds the dependencies in the correct order using PNPM's filtering capabilities.
- The `dist/` folders are generated.
- Next.js successfully compiles without resolver hangs.
