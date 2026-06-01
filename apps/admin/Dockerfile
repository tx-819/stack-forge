# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate \
    && pnpm config set store-dir /pnpm/store

# 根上下文：仅装 admin 及其依赖
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json apps/admin/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter admin...
COPY apps/admin apps/admin
RUN pnpm --filter admin build

FROM nginx:1.27-alpine AS runtime
# 删除官方默认 server，避免 80 端口冲突；模板由官方 entrypoint 启动时通过 envsubst 渲染
RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/admin/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html

# 仅替换我们声明的变量，避免覆盖 nginx 自身的 $host、$uri 等
ENV NGINX_ENVSUBST_FILTER="^BACKEND_UPSTREAM$"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
