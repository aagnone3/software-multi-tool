# Multi-stage build for optimized production image

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/logs/package.json ./packages/logs/
COPY packages/config/package.json ./packages/config/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ai/package.json ./packages/ai/
COPY packages/mail/package.json ./packages/mail/
COPY packages/payments/package.json ./packages/payments/
COPY packages/storage/package.json ./packages/storage/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/agent-sdk/package.json ./packages/agent-sdk/
COPY packages/render/package.json ./packages/render/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY config/package.json ./config/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 3: Build
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY . .

# Generate Prisma client
RUN pnpm --filter @repo/database generate

# Build api-server
RUN pnpm --filter @repo/api-server build

# Stage 4: Production image
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy necessary files from builder
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built api-server
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=builder /app/apps/api-server/package.json ./apps/api-server/

# Copy all workspace packages (needed for runtime imports)
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/config ./config
COPY --from=builder /app/tooling ./tooling

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Prisma client is needed at runtime
RUN pnpm --filter @repo/database generate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify
USER fastify

EXPOSE 4000

CMD ["pnpm", "--filter", "@repo/api-server", "start"]
