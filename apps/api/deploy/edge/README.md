# Edge 反向代理栈（nginx + certbot）

服务器上所有项目共用的「前台」：**在宿主机监听 80/443**，终止 TLS，并将流量反代到接入 **`edge`** 网络的各业务容器。

- **`nginx/conf.d/react-admin.conf`**：`EDGE_DOMAIN` → **`react-admin:80`**（前端 SPA）。
- **`nginx/conf.d/nest-admin-api.conf`**：`API_DOMAIN` → **`nest-admin:3000`**（后端 API）。

与旧版 **caddy-docker-proxy** 的差异：路由须在 **`nginx/conf.d/`** 内显式维护；每新增对外域名，维护对应 `server` 并执行 **certbot**。

脚本在 **`scripts/`**（在 edge 根目录执行：`sh ./scripts/setup-https.sh`）。

## 前置条件

- 域名 **A/AAAA** 指向本机公网 IP（`EDGE_DOMAIN` 与 `API_DOMAIN` 各一条记录，或按你的 DNS 策略）。
- **80、443** 未被占用；若曾运行 Caddy edge，先 **`docker compose down`** 释放端口。
- 业务容器与 **`edge-nginx`** 在同一网络 **`edge`** 上，且 **`expose`** 了被反代的端口（前端 **80**，API **3000**）。

## 一台机器一份 edge

只部署**一份**本目录到服务器（例如 `/opt/edge`），不要与业务 compose 重复占用 80/443。

## 首次部署顺序

1. 将本目录拷到服务器，例如 `scp -r deploy/edge/ user@host:/opt/edge`。
2. `cp .env.example .env`，填写 `EDGE_DOMAIN`、`API_DOMAIN`、`CERTBOT_EMAIL`。
3. 将 **`nginx/conf.d/react-admin.conf`**、**`nest-admin-api.conf`** 中的 **`app.example.com` / `api.example.com`** 分别替换为你的真实域名（与 `.env` 一致），或保留占位并在签发前替换。
4. `docker compose up -d`，确认网络 **`edge`** 存在。
5. 启动 **`nest-admin`** 业务栈，再启动 **`react-admin`**（均需 `networks.edge.external: true`）。
6. **前端证书**：`sh ./scripts/setup-https.sh`（HTTP-01 + webroot，写入 `EDGE_DOMAIN` 证书并切换 HTTPS conf）。
7. **API 证书**：`sh ./scripts/setup-https-api.sh`。
8. 校验：`sh ./scripts/verify-https.sh`（若 `.env` 含 `API_DOMAIN` 会同时探测 API）。

## 同机联调（react-admin + nest-admin）

- **相对路径 `/api`（推荐默认）**：在 `react-admin` 部署 Secret 中设置 **`BACKEND_UPSTREAM=http://nest-admin:3000`**；浏览器访问 `https://<EDGE_DOMAIN>/api/...`。
- **API 子域名**：浏览器直连 `https://<API_DOMAIN>` 时，在 **`nest-admin`** 环境变量中设置 **`CORS_ORIGINS=https://<EDGE_DOMAIN>`**（多源用英文逗号分隔）。

## SAN 证书（可选）

若希望**单张证书**覆盖 `EDGE_DOMAIN` 与 `API_DOMAIN`，可手工执行一次：

`docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d "$EDGE_DOMAIN" -d "$API_DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --non-interactive`

然后将两个 HTTPS 示例 conf 中的 **`ssl_certificate`** 路径改为 Let's Encrypt 为该多域名证书生成的 **`live/<主域名>/`** 目录（以 `certbot certificates` 输出为准），再 **`nginx -t`** 与 **`nginx -s reload`**。

## 续期与 cron

- `sh ./scripts/renew-cert.sh` / `sh ./scripts/renew-cert.sh --dry-run`
- `sh ./scripts/install-auto-renew-cron.sh --install`
