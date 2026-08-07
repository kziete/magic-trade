# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `output: standalone` bakes rewrites() destinations into routes-manifest.json
# at build time, so BACKEND_INTERNAL_URL must be available here, not just at
# container runtime.
ARG BACKEND_INTERNAL_URL=http://web:8000
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
# V8 sizes its default heap off total *host* memory, not a container's cgroup
# --memory limit, so left alone it can try to grow past a constrained build
# container's cap and get SIGKILLed by the kernel (seen in production: the
# TypeScript-check phase of `next build` killed outright) instead of failing
# with a clear "heap out of memory" error. Let the build pin it explicitly.
ARG NODE_OPTIONS=""
ENV NODE_OPTIONS=$NODE_OPTIONS
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
