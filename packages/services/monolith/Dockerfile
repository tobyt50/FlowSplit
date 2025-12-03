# ---- Base Stage ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app
# Copy root config files
COPY package.json pnpm-lock.yaml turbo.json ./

# ---- Builder Stage ----
FROM base AS builder
# Install pnpm and system dependencies if needed
RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++

# 1. COPY SOURCE FIRST
# Copy the entire monorepo so pnpm can link workspaces correctly
COPY . .

# 2. INSTALL ALL DEPENDENCIES
# Removed --frozen-lockfile to ensure lockfile can update if needed during build
RUN pnpm install

# 3. GENERATE PRISMA CLIENT
# Essential for type definitions during build
RUN pnpm --filter @flowsplit/prisma exec prisma generate

# 4. EXPLICITLY BUILD SHARED LIBRARIES
# We force these to build first so their .d.ts files exist 
# when the services try to import them.
RUN pnpm --filter @flowsplit/prisma run build
RUN pnpm --filter @flowsplit/auth run build

# Debug step (optional, can be kept)
RUN ls -la packages/libs/auth/dist

# 5. BUILD MONOLITH
# Now we build the monolith service. 
# We skip the cache to ensure it sees the fresh libs.
RUN pnpm turbo run build --filter=@flowsplit/monolith --force

# ---- Production Stage ----
FROM base AS production
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy root config files
COPY package.json pnpm-lock.yaml turbo.json ./

# Copy package definitions to install prod dependencies
COPY packages/services/monolith/package.json ./packages/services/monolith/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/libs/auth/package.json ./packages/libs/auth/

# Install ONLY production dependencies
# We need the workspace structure temporarily for linking
COPY packages/services/monolith ./packages/services/monolith
COPY packages/prisma ./packages/prisma
COPY packages/libs/auth ./packages/libs/auth

# Install prod deps
RUN pnpm install --prod --ignore-scripts

# Copy the built artifacts from the builder stage
COPY --from=builder /usr/src/app/packages/services/monolith/dist ./packages/services/monolith/dist
COPY --from=builder /usr/src/app/packages/prisma/dist ./packages/prisma/dist
COPY --from=builder /usr/src/app/packages/libs/auth/dist ./packages/libs/auth/dist

# Copy Prisma schema
COPY --from=builder /usr/src/app/packages/prisma/schema.prisma ./packages/prisma/schema.prisma

# --- THE FIX ---
# Instead of copying the complex .prisma folder (which fails with checksum errors),
# we simply regenerate it here. 'pnpm dlx' runs the prisma CLI without installing it globally.
RUN pnpm dlx prisma generate --schema=./packages/prisma/schema.prisma

# Expose Port
EXPOSE 4000

# Run the Monolith
CMD ["node", "packages/services/monolith/dist/main.js"]