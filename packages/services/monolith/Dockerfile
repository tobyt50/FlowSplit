# ---- Base Stage ----
FROM node:20-alpine AS base
# Enable pnpm via corepack
RUN corepack enable
WORKDIR /usr/src/app
# Copy root config files
COPY package.json pnpm-lock.yaml turbo.json ./

# ---- Builder Stage ----
FROM base AS builder
# Install system deps required for some node modules
RUN apk add --no-cache python3 make g++

# 1. COPY SOURCE
# Copy the entire monorepo
COPY . .

# 2. INSTALL ALL DEPENDENCIES
RUN pnpm install

# 3. GENERATE & BUILD SHARED LIBS
# Generate Prisma Client
RUN pnpm --filter @flowsplit/prisma exec prisma generate
# Build libs to generate .d.ts and .js files
RUN pnpm --filter @flowsplit/prisma run build
RUN pnpm --filter @flowsplit/auth run build

# 4. BUILD MONOLITH
# Build the service
RUN pnpm turbo run build --filter=@flowsplit/monolith --force

# 5. PRUNE DEPENDENCIES
# Remove devDependencies from node_modules to make the image smaller
# The --prod flag ensures only runtime deps remain
RUN pnpm prune --prod

# ---- Production Stage ----
FROM base AS production
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/package.json ./package.json

# 2. REGENERATE PRISMA CLIENT (Just to be safe with binary paths)
# We point to the schema inside the copied packages
RUN pnpm dlx prisma@5.12.1 generate --schema=./packages/prisma/schema.prisma

# Expose Port
EXPOSE 4000

# Run the Monolith
# We use the full path to the main.js
CMD ["node", "packages/services/monolith/dist/main.js"]