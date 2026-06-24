# syntax=docker/dockerfile:1

# ---------- build ----------
# Debian slim (glibc + OpenSSL 3) keeps Prisma's engine/binary targets simple.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Generate the Prisma client, then compile NestJS → dist/.
RUN npx prisma generate && npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Installed deps carry the generated Prisma client AND the prisma CLI (needed for
# `migrate deploy` at startup); build output is the compiled server.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
EXPOSE 4000
# Apply any pending migrations (idempotent), then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
