# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The browser only ever talks to the frontend origin; "/api/*" is proxied to the
# backend by next.config rewrites. NEXT_PUBLIC_* is inlined at build time.
ENV NEXT_PUBLIC_API_URL=/api
# The proxy target is read by next.config; bake the compose service name in.
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
# Bind all interfaces so the published port is reachable from the host.
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
