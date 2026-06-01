# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runtime
# 删除官方默认 server，避免 80 端口冲突；模板由官方 entrypoint 启动时通过 envsubst 渲染
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# 仅替换我们声明的变量，避免覆盖 nginx 自身的 $host、$uri 等
ENV NGINX_ENVSUBST_FILTER="^BACKEND_UPSTREAM$"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
