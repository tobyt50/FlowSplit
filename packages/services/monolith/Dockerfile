# ---- Base Stage ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml turbo.json ./

# ---- Builder Stage ----
FROM base AS builder
RUN npm install -g pnpm

# 1. COPY EVERYTHING FIRST
# We must copy the full source tree so pnpm can see the package.json 
# files inside packages/prisma, packages/auth, etc.
COPY . .

# 2. INSTALL ALL DEPENDENCIES
# Now pnpm installs dependencies for the Root AND all Sub-packages.
RUN pnpm install --frozen-lockfile

# 3. GENERATE PRISMA CLIENT
# Critical: The build will fail if the Prisma Client types aren't generated.
RUN pnpm --filter @flowsplit/prisma exec prisma generate

RUN pnpm --filter @flowsplit/prisma run build
RUN pnpm --filter @flowsplit/auth run build

# 4. BUILD MONOLITH
# We use Turbo to build the monolith and its dependencies.
RUN pnpm turbo run build --filter=@flowsplit/monolith...

# ---- Production Stage ----
FROM base AS production
RUN npm install -g pnpm

# Copy the root files to setup the workspace structure
COPY package.json pnpm-lock.yaml turbo.json ./

# We need the package definitions to install prod deps correctly
COPY packages/services/monolith/package.json ./packages/services/monolith/
COPY packages/prisma/package.json ./packages/prisma/
# (Add other package.jsons if necessary for strictness, but usually pnpm handles the workspace)

# Install ONLY production dependencies to keep image small
# We need to copy the full source again temporarily to resolve workspace links during install
COPY . .
RUN pnpm install --prod --frozen-lockfile

# Copy the built artifacts from the builder stage
# We overwrite the source with the compiled output
COPY --from=builder /usr/src/app/packages/services/monolith/dist ./packages/services/monolith/dist
COPY --from=builder /usr/src/app/packages/prisma/dist ./packages/prisma/dist

# Ensure the Prisma Client binary is available in production
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/packages/prisma/node_modules/.prisma ./packages/prisma/node_modules/.prisma

# Expose Port 4000
EXPOSE 4000

# Run the Monolith
CMD ["node", "packages/services/monolith/dist/main.js"]