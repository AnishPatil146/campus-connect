# Campus Connect

One Platform. Three Colleges. Connected Together.

This repository is set up as a monorepo using **Turborepo** and **pnpm workspaces**.

## Repository Structure

```
campus-connect/
├── apps/
│   ├── web/          # Next.js Website & Admin Portal
│   ├── api/          # NestJS Backend API
│   └── mobile/       # Flutter Mobile Application
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

## Mobile Application (Flutter)

Inside the `apps/mobile` directory:

1. **Install dependencies**:
   ```bash
   flutter pub get
   ```

2. **Analyze code**:
   ```bash
   flutter analyze
   ```

3. **Run unit & widget tests**:
   ```bash
   flutter test
   ```

4. **Generate standalone Release APK**:
   ```bash
   flutter build apk --release
   ```

5. **Generate Google Play App Bundle (AAB)**:
   ```bash
   flutter build appbundle --release
   ```

