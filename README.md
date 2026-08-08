# Campus Connect

One Platform. Three Colleges. Connected Together.

This repository is set up as a monorepo using **Turborepo** and **pnpm workspaces**.

## Repository Structure

```
campus-connect/
├── apps/
│   ├── web/          # Next.js Website & Admin Portal
│   ├── api/          # NestJS Backend API
│   └── mobile/       # Expo React Native Mobile Application
│
├── packages/
│   ├── ui/           # Shared React UI Component Library
│   ├── types/        # Shared TypeScript interface and type definitions
│   └── utils/        # Shared utilities and helper functions
│
├── docs/             # Technical specifications & guides
```

## Setup & Running

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

4. **Lint the project**:
   ```bash
   pnpm lint
   ```

## Mobile Application (Expo React Native)

Inside the `apps/mobile` directory:

1. **Start dev server**:
   ```bash
   pnpm --filter @campus-connect/mobile start
   ```

2. **Typecheck & lint**:
   ```bash
   pnpm --filter @campus-connect/mobile lint
   ```

3. **Generate Android APK / App Bundle**:
   ```bash
   eas build --platform android --profile production
   ```

