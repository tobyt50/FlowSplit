# ---- Base Stage ----
# Use a specific Node.js version for reproducibility.
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# --- Dependencies Stage ---
# This stage's only job is to install ALL dependencies for the entire monorepo.
FROM base AS deps
# Install pnpm globally in the container.
RUN npm install -g pnpm
# Copy files that define the dependency tree.
COPY package.json pnpm-lock.yaml ./
COPY turbo.json turbo.json
# Install all dependencies.
RUN pnpm install --frozen-lockfile

# --- Builder Stage ---
# This stage builds the TypeScript code into JavaScript.
FROM base AS builder
# Install pnpm.
RUN npm install -g pnpm
# Copy the node_modules from the 'deps' stage. This is faster than reinstalling.
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the rest of the source code.
COPY . .
# Use Turborepo to build the monolith application AND its local dependencies.
# The `...` tells Turbo to build all required packages in the correct order.
RUN pnpm turbo run build --filter=@flowsplit/monolith...

# --- Production Stage ---
# This is the final, lean image for production.
FROM base AS production
# Install pnpm.
RUN npm install -g pnpm
# Copy the root package files.
COPY package.json pnpm-lock.yaml ./
# Install ONLY production dependencies for the entire workspace.
RUN pnpm install --prod --frozen-lockfile
# Copy the built JavaScript artifacts for the monolith from the builder stage.
COPY --from=builder /usr/src/app/packages/services/monolith/dist ./dist
# We also need the Prisma schema at runtime.
COPY --from=builder /usr/src/app/packages/prisma/schema.prisma ./packages/prisma/schema.prisma

# Expose the port the service runs on.
EXPOSE 4000

# The command to run the monolith application.
CMD ["node", "dist/main.js"]