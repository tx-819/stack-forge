# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN apk add --no-cache openssl tini \
    && corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm config set store-dir /pnpm/store

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm prisma generate \
    && pnpm build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
RUN apk add --no-cache openssl tini

ENV NODE_ENV=production \
    PATH=/app/node_modules/.bin:$PATH

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build     /app/dist          ./dist
COPY --chown=node:node --from=build     /app/src/generated ./src/generated
COPY --chown=node:node --from=build     /app/prisma        ./prisma
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
