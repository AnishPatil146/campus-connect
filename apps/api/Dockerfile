# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.0.0
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* turbo.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --no-frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm --filter @campus-connect/types build
RUN pnpm --filter @campus-connect/utils build
RUN pnpm --filter @campus-connect/api prisma:generate
RUN pnpm --filter @campus-connect/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 10000
CMD ["node", "apps/api/dist/main"]
