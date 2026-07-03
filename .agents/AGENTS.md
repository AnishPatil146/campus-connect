# Campus Connect Project Rules

All development in this workspace must adhere to the following architecture, tech stack, coding standards, and philosophy:

## Workspace Structure
```
campus-connect/
│
├── apps/
│   ├── web/                  # Next.js
│   ├── api/                  # NestJS
│   └── mobile/               # Flutter (later)
│
├── packages/
│   ├── ui/
│   ├── config/
│   ├── types/
│   └── utils/
│
├── docs/
│   ├── api/
│   ├── database/
│   ├── design/
│   └── meeting-notes/
│
├── docker/
│
├── .github/
│   └── workflows/
│
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Tech Stack
* **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, TanStack Query, Axios
* **Backend**: NestJS, Prisma, PostgreSQL, JWT, Passport, bcrypt, Zod, Swagger
* **DevOps**: Docker, Docker Compose, GitHub Actions

## Backend Modules
Notice every feature must be its own module inside backend `src/`:
* `auth`
* `users`
* `colleges`
* `students`
* `teachers`
* `departments`
* `courses`
* `timetable`
* `events`
* `announcements`
* `notifications`
* `reports`
* `backups`
* `audit`
* `common`
* `config`

## Frontend Pages
* `/` (Home)
* `/login`
* `/dashboard`
* `/students`
* `/teachers`
* `/events`
* `/timetable`
* `/announcements`
* `/profile`
* `/settings`

## UI Theme & Styling
* **Aesthetics**: Linear + Vercel + Notion
* **Principles**: Minimal, Clean, Fast, Lots of whitespace, Rounded cards, Professional typography, Smooth transitions.
* **Guideline**: No flashy gradients everywhere.

## Database Naming Rules
* Use consistent and simple plural/group names.
* **Examples**: `users`, `students`, `teachers`, `events`, `announcements`, `timetables`.
* **Prohibited**: `tblUsers`, `student_master`, `event_data`.

## Authentication Flow
* `Login` -> `JWT Access Token` -> `Refresh Token` -> `Role Guard` -> `Dashboard`

## Coding Standards (API Responses)
* **Success Format**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {}
  }
  ```
* **Error Format**:
  ```json
  {
    "success": false,
    "message": "Invalid credentials",
    "errors": []
  }
  ```

## Documentation Guidelines
Document everything from the start under `docs/`:
* `docs/database.md`
* `docs/api.md`
* `docs/deployment.md`
* `docs/architecture.md`
* `docs/contributing.md`

## Development Philosophy
Every feature follows the same lifecycle:
1. Create database schema
2. Build backend API
3. Test the API
4. Build frontend UI
5. Connect frontend to backend
6. Test end-to-end
7. Merge into develop
