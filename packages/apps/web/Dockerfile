# ---- Builder Stage ----
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Set the PATH to include the node_modules binaries
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# Copy files required to install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/apps/*/package.json ./packages/apps/
COPY packages/libs/*/package.json ./packages/libs/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/services/*/package.json ./packages/services/
COPY packages/prisma/schema.prisma ./packages/prisma/schema.prisma

# Install ALL dependencies
RUN pnpm install

# Generate the Prisma client
RUN pnpm --filter @flowsplit/prisma run db:generate

# Copy the rest of the source code
COPY . .

# Build this specific app using its own build script
RUN turbo run build --filter=web

# ---- Production Stage ----
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
EXPOSE 3000

# Copy the standalone Next.js server output from the builder stage
COPY --from=builder /usr/src/app/packages/apps/web/.next/standalone ./
# Copy the public assets
COPY --from=builder /usr/src/app/packages/apps/web/public ./public

CMD ["node", "server.js"]