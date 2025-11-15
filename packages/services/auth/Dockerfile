# ---- Builder Stage ----
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Set the PATH to include the node_modules binaries
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# Copy files required to install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY .npmrc ./
COPY packages/apps/*/package.json ./packages/apps/
COPY packages/libs/*/package.json ./packages/libs/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/services/*/package.json ./packages/services/
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/schema.prisma ./packages/prisma/schema.prisma

# Install ALL dependencies
RUN pnpm install

# Generate the Prisma client
RUN pnpm --filter @flowsplit/prisma run db:generate

# Copy the rest of the source code
COPY . .

# Build this specific service using its own build script
RUN turbo run build --filter=@flowsplit/auth-service

# ---- Production Stage ----
FROM node:18-alpine AS production
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Copy files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
COPY packages/apps/*/package.json ./packages/apps/
COPY packages/libs/*/package.json ./packages/libs/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/services/*/package.json ./packages/services/
COPY packages/shared/package.json ./packages/shared/

# Install ONLY production dependencies
RUN pnpm install --prod

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/packages/services/auth/dist ./dist
COPY --from=builder /usr/src/app/packages/prisma/schema.prisma ./schema.prisma

EXPOSE 3100
CMD ["node", "dist/main.js"]