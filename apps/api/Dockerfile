# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN apk add --no-cache openssl tini \
    && corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm config set store-dir /pnpm/store

# 构建阶段：根上下文，仅装 api 及其依赖。
# 安装原生模块工具链（bcrypt 在 alpine/musl 上可能需源码编译）。
FROM base AS build
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api...
COPY packages/contracts packages/contracts
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @stack-forge/contracts build \
    && pnpm --filter @stack-forge/shared build \
    && pnpm --filter api exec prisma generate \
    && pnpm --filter api build
# 产出仅含 prod 依赖的自包含 node_modules（含已编译的 bcrypt 等原生模块）。
# 注意：pnpm deploy 遵循 npm pack 规则，会排除被 gitignore 的 dist / src/generated，
# 因此构建产物从 build 阶段的 workspace 目录直接拷贝。
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter api deploy --prod --legacy /prod

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
RUN apk add --no-cache openssl tini

ENV NODE_ENV=production \
    PATH=/app/node_modules/.bin:$PATH

COPY --chown=node:node --from=build /prod/node_modules        ./node_modules
COPY --chown=node:node --from=build /app/apps/api/dist          ./dist
COPY --chown=node:node --from=build /app/apps/api/src/generated ./src/generated
COPY --chown=node:node --from=build /app/apps/api/prisma        ./prisma
COPY --chown=node:node --from=build /app/apps/api/package.json /app/apps/api/prisma.config.ts ./
COPY --chown=node:node apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
