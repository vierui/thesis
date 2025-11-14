# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1
# Copy only lock + manifest first for better caching
COPY package*.json ./
# Install full deps for build (dev + prod)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM node:24-alpine AS build
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Build-time arguments for NEXT_PUBLIC_ variables (baked into client bundle)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_LLM_SERVER_URL
ARG NEXT_PUBLIC_SERVER_API

# Set as environment variables for Next.js build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL \
    NEXT_PUBLIC_LLM_SERVER_URL=$NEXT_PUBLIC_LLM_SERVER_URL \
    NEXT_PUBLIC_SERVER_API=$NEXT_PUBLIC_SERVER_API

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client with Alpine (musl) binaries
RUN npx prisma generate
# Build Next.js
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
# Alpine packages needed by Prisma runtime and database connectivity checks
RUN apk add --no-cache openssl libc6-compat netcat-openbsd
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    PRISMA_SKIP_POSTINSTALL=1

# Copy standalone build output (includes all dependencies)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Copy Prisma client and schema
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

# Copy package.json for prisma commands
COPY --from=build /app/package.json ./package.json

# Copy and setup entrypoint script for auto-migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Set proper ownership for node user
RUN chown -R node:node /app && \
    chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

USER node
ENTRYPOINT ["/app/docker-entrypoint.sh"]