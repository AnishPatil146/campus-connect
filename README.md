# Campus Connect

One Platform. Three Colleges. Connected Together.

This repository is set up as a monorepo using **Turborepo** and **npm workspaces**.

## Repository Structure

```
campus-connect/
├── apps/
│   ├── web/          # React + Vite + TypeScript (Tailwind CSS v4)
│   ├── api/          # Express + TypeScript + Prisma ORM (PostgreSQL)
│   └── mobile/       # React Native / Expo skeleton
│
├── packages/
│   ├── ui/           # Shared React UI Component Library
│   ├── types/        # Shared TypeScript interface and type definitions
│   └── utils/        # Shared utilities and helper functions
│
├── docs/             # Documentation files
```

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Lint the project**:
   ```bash
   npm run lint
   ```
