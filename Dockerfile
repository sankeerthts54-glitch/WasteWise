# Multi-stage production build for WasteWise Express API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configuration and lockfiles
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install all dependencies across workspaces needed for build
RUN npm ci

# Copy source files for shared and server workspaces
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared first, then server
RUN npm run build --workspace=shared && npm run build --workspace=server

# Prune non-production dependencies to minimize image size
RUN npm prune --omit=dev

# -------------------------------------------------------------
# Production runtime container
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install dumb-init or curl for container health check
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 apprunner -G nodejs

# Copy root package & lockfile
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Fix file permissions for non-root user
RUN chown -R apprunner:nodejs /app

USER apprunner

WORKDIR /app/server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
