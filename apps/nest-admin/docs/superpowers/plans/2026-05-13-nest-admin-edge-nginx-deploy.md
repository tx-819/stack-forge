# nest-admin Edge（nginx + certbot）与 CI 对齐实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `deploy/edge` 迁移为与 `react-admin` 同构的 nginx + certbot；废弃 Caddy 叠加与相关 CI 逻辑；为 API 子域名提供 edge 配置范例；通过 `CORS_ORIGINS` 支持浏览器跨子域调用 API。

**架构：** 公网 TLS 在宿主机 edge nginx 终结；`app.example.com` → `react-admin:80`；`api.example.com` → `nest-admin:3000`；同机 `BACKEND_UPSTREAM=http://nest-admin:3000` 仍支持 `/api` 相对路径。Nest 在 `CORS_ORIGINS` 非空时 `enableCors`。

**技术栈：** Docker Compose、nginx、certbot、GitHub Actions、NestJS 11、Jest。

---

## 将创建或修改的文件（职责）

| 路径 | 职责 |
|------|------|
| `deploy/edge/docker-compose.yml` | nginx + certbot，网络名 `edge`（替换原 Caddy 栈） |
| `deploy/edge/nginx/conf.d/react-admin.conf` | 前端域名 HTTP-only，ACME webroot + 反代 `react-admin:80` |
| `deploy/edge/nginx/conf.d/react-admin.conf.https.example` | 前端 HTTPS 模板 |
| `deploy/edge/nginx/conf.d/nest-admin-api.conf` | API 域名 HTTP-only |
| `deploy/edge/nginx/conf.d/nest-admin-api.conf.https.example` | API HTTPS 模板 |
| `deploy/edge/scripts/setup-https.sh` | 为 `EDGE_DOMAIN` 签发证书并切换前端 conf |
| `deploy/edge/scripts/setup-https-api.sh` | 为 `API_DOMAIN` 签发证书并切换 API conf |
| `deploy/edge/scripts/renew-cert.sh` | certbot renew + nginx reload（与 react-admin 一致） |
| `deploy/edge/scripts/verify-https.sh` | curl 校验 HTTP/HTTPS；若设置了 `API_DOMAIN` 则一并校验 |
| `deploy/edge/scripts/install-auto-renew-cron.sh` | crontab 提示/安装 |
| `deploy/edge/.env.example` | `EDGE_DOMAIN`、`API_DOMAIN`、`CERTBOT_EMAIL` 等 |
| `deploy/edge/README.md` | 部署顺序、双域名证书、与 nest/react 同机说明 |
| `deploy/edge/Caddyfile` | **删除**（Caddy 已废弃） |
| `docker-compose.caddy.yml` | **删除** |
| `docker-compose.yml` | 更新顶部注释：公网路由改由 edge nginx 维护 |
| `.github/workflows/deploy.yml` | 对齐 react-admin 命名与结构；去掉 `SSL_DOMAIN`/`COMPOSE_FILE`/`docker-compose.caddy.yml`；保留 `APP_ENV` 与 `--wait` |
| `src/common/configs/parse-cors-origins.ts` | 解析逗号分隔的 CORS 源（可测） |
| `src/common/configs/parse-cors-origins.spec.ts` | 单元测试 |
| `src/common/configs/app.config.ts` | 注册 `corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS)` |
| `src/main.ts` | `corsOrigins.length` 时 `enableCors({ origin, credentials: true })` |
| `.env.template` | 增加可选 `CORS_ORIGINS` 说明 |
| `README.md` | 新增「Docker 与生产部署」：edge → nest-admin → react-admin、`BACKEND_UPSTREAM`、`CORS_ORIGINS` |
| `docs/superpowers/specs/2026-05-13-nest-admin-edge-nginx-deploy-design.md` | 将 **状态** 改为「已实现」（实现全部完成后） |

---

### 任务 1：替换 `deploy/edge/docker-compose.yml` 并删除 `Caddyfile`

**文件：**
- 删除：`deploy/edge/Caddyfile`
- 创建：`deploy/edge/docker-compose.yml`

- [ ] **步骤 1：删除 Caddyfile**

```bash
rm -f deploy/edge/Caddyfile
```

- [ ] **步骤 2：写入 docker-compose.yml（与 react-admin 一致）**

创建 `deploy/edge/docker-compose.yml`，内容为：

```yaml
# Edge 栈：宿主机边界 nginx（TLS 终结 + 反代）。先启动本栈以创建 docker 网络 edge。
# 业务项目 compose 中 edge 应为 external: true，故依赖本目录先 docker compose up -d。
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: edge-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot_www:/var/www/certbot
      - certbot_conf:/etc/letsencrypt:ro
    networks:
      - edge
    restart: unless-stopped

  certbot:
    image: certbot/certbot:v2.11.0
    restart: "no"
    volumes:
      - certbot_www:/var/www/certbot
      - certbot_conf:/etc/letsencrypt

networks:
  edge:
    name: edge

volumes:
  certbot_www:
  certbot_conf:
```

- [ ] **步骤 3：Commit**

```bash
git add deploy/edge/docker-compose.yml deploy/edge/Caddyfile
git commit -m "deploy(edge): replace Caddy stack with nginx+certbot compose"
```

（若 `Caddyfile` 已不存在，`git add` 需含删除：`git add -u deploy/edge/Caddyfile`。）

---

### 任务 2：前端 `nginx/conf.d`（与 react-admin 一致）

**文件：**
- 创建：`deploy/edge/nginx/conf.d/react-admin.conf`
- 创建：`deploy/edge/nginx/conf.d/react-admin.conf.https.example`

- [ ] **步骤 1：写入 `react-admin.conf`**

```nginx
# 仓库默认：仅 HTTP — 无证书时 nginx 可启动，供首次 certbot webroot 签发。
# 证书就绪后：将 react-admin.conf.https.example 复制为本文件并替换域名，或按 README「启用 HTTPS」操作。
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name app.example.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    proxy_pass http://react-admin:80;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
```

- [ ] **步骤 2：写入 `react-admin.conf.https.example`**

```nginx
# 签发证书后：复制为 react-admin.conf（覆盖默认 HTTP-only），并将三处 app.example.com 改为你的域名。
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name app.example.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  http2 on;
  server_name app.example.com;

  ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  location / {
    proxy_pass http://react-admin:80;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
```

- [ ] **步骤 3：Commit**

```bash
git add deploy/edge/nginx/conf.d/react-admin.conf deploy/edge/nginx/conf.d/react-admin.conf.https.example
git commit -m "deploy(edge): add react-admin nginx vhosts"
```

---

### 任务 3：API 子域名 `nginx/conf.d`

**文件：**
- 创建：`deploy/edge/nginx/conf.d/nest-admin-api.conf`
- 创建：`deploy/edge/nginx/conf.d/nest-admin-api.conf.https.example`

- [ ] **步骤 1：写入 `nest-admin-api.conf`**

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name api.example.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    proxy_pass http://nest-admin:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_buffering off;
  }
}
```

- [ ] **步骤 2：写入 `nest-admin-api.conf.https.example`**

```nginx
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen 80;
  server_name api.example.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  http2 on;
  server_name api.example.com;

  ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  location / {
    proxy_pass http://nest-admin:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_buffering off;
  }
}
```

- [ ] **步骤 3：Commit**

```bash
git add deploy/edge/nginx/conf.d/nest-admin-api.conf deploy/edge/nginx/conf.d/nest-admin-api.conf.https.example
git commit -m "deploy(edge): add nest-admin API subdomain nginx vhosts"
```

---

### 任务 4：Edge 脚本与 `.env.example`

**文件：**
- 创建：`deploy/edge/scripts/setup-https.sh`
- 创建：`deploy/edge/scripts/setup-https-api.sh`
- 创建：`deploy/edge/scripts/renew-cert.sh`
- 创建：`deploy/edge/scripts/verify-https.sh`
- 创建：`deploy/edge/scripts/install-auto-renew-cron.sh`
- 创建：`deploy/edge/.env.example`

- [ ] **步骤 1：写入 `deploy/edge/scripts/setup-https.sh`**

```sh
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${EDGE_DOMAIN:-}" ]; then
  echo "EDGE_DOMAIN is required in .env" >&2
  exit 1
fi

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL is required in .env" >&2
  exit 1
fi

echo "Issuing certificate for: $EDGE_DOMAIN"
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$EDGE_DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos --non-interactive

echo "Switching nginx config to HTTPS template"
cp ./nginx/conf.d/react-admin.conf.https.example ./nginx/conf.d/react-admin.conf
sed -i.bak "s/app\.example\.com/${EDGE_DOMAIN}/g" ./nginx/conf.d/react-admin.conf
grep -n "${EDGE_DOMAIN}" ./nginx/conf.d/react-admin.conf

echo "Validating and reloading nginx"
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "HTTPS setup completed for: $EDGE_DOMAIN"
```

- [ ] **步骤 2：写入 `deploy/edge/scripts/setup-https-api.sh`**

```sh
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${API_DOMAIN:-}" ]; then
  echo "API_DOMAIN is required in .env" >&2
  exit 1
fi

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL is required in .env" >&2
  exit 1
fi

echo "Issuing certificate for API: $API_DOMAIN"
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$API_DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos --non-interactive

echo "Switching API nginx config to HTTPS template"
cp ./nginx/conf.d/nest-admin-api.conf.https.example ./nginx/conf.d/nest-admin-api.conf
sed -i.bak "s/api\.example\.com/${API_DOMAIN}/g" ./nginx/conf.d/nest-admin-api.conf
grep -n "${API_DOMAIN}" ./nginx/conf.d/nest-admin-api.conf

echo "Validating and reloading nginx"
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "HTTPS setup completed for API: $API_DOMAIN"
```

- [ ] **步骤 3：写入 `deploy/edge/scripts/renew-cert.sh`**

```sh
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

case "${1:-}" in
  "")
    docker compose run --rm certbot renew
    docker compose exec -T nginx nginx -s reload
    echo "renew-cert: done (renew + nginx reload)"
    ;;
  --dry-run)
    docker compose run --rm certbot renew --dry-run
    echo "renew-cert: dry-run OK (no cert or nginx changes)"
    ;;
  *)
    echo "Usage: $0 [--dry-run]" >&2
    exit 1
    ;;
esac
```

- [ ] **步骤 4：写入 `deploy/edge/scripts/verify-https.sh`**

```sh
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${EDGE_DOMAIN:-}" ]; then
  echo "EDGE_DOMAIN is required in .env" >&2
  exit 1
fi

echo "==> HEAD http://${EDGE_DOMAIN}/"
curl -sS -I --max-time 20 "http://${EDGE_DOMAIN}/" || exit 1
echo
echo "==> HEAD https://${EDGE_DOMAIN}/"
curl -sS -I --max-time 20 "https://${EDGE_DOMAIN}/" || exit 1
echo

if [ -n "${API_DOMAIN:-}" ]; then
  echo "==> HEAD http://${API_DOMAIN}/"
  curl -sS -I --max-time 20 "http://${API_DOMAIN}/" || exit 1
  echo
  echo "==> HEAD https://${API_DOMAIN}/"
  curl -sS -I --max-time 20 "https://${API_DOMAIN}/" || exit 1
  echo
fi

echo "OK: endpoints responded (see status lines above)."
```

- [ ] **步骤 5：写入 `deploy/edge/scripts/install-auto-renew-cron.sh`**

```sh
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
RENEW_SCRIPT="$SCRIPT_DIR/renew-cert.sh"
LOG_FILE="${CRON_LOG:-$HOME/logs/edge-certbot-renew.log}"
SCHEDULE="${CRON_SCHEDULE:-12 3 * * *}"

if [ ! -f "$RENEW_SCRIPT" ]; then
  echo "Missing renew-cert.sh next to this script: $RENEW_SCRIPT" >&2
  exit 1
fi

print_block() {
  echo "SHELL=/bin/bash"
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  echo "$SCHEDULE /bin/sh $RENEW_SCRIPT >>$LOG_FILE 2>&1"
}

case "${1:-}" in
  "")
    echo "# 将下列行加入 crontab（crontab -e），或执行: $0 --install"
    echo ""
    print_block
    echo ""
    echo "可选环境变量：CRON_SCHEDULE（默认 12 3 * * *）、CRON_LOG（默认 \$HOME/logs/edge-certbot-renew.log）"
    ;;
  --install)
    mkdir -p "$(dirname "$LOG_FILE")"
    if crontab -l 2>/dev/null | grep -qF "$RENEW_SCRIPT"; then
      echo "当前 crontab 已包含该脚本路径，跳过写入："
      echo "  $RENEW_SCRIPT"
      echo "如需修改请执行: crontab -e"
      exit 0
    fi
    {
      crontab -l 2>/dev/null || true
      echo ""
      echo "# edge certbot auto-renew (install-auto-renew-cron.sh)"
      print_block
    } | crontab -
    echo "已写入当前用户的 crontab："
    print_block
    echo "日志: $LOG_FILE"
    echo "建议先演练: /bin/sh $RENEW_SCRIPT --dry-run"
    ;;
  *)
    echo "Usage: $0 [--install]" >&2
    echo "  Env: CRON_SCHEDULE  CRON_LOG" >&2
    exit 1
    ;;
esac
```

- [ ] **步骤 6：可执行权限**

```bash
chmod +x deploy/edge/scripts/*.sh
```

- [ ] **步骤 7：写入 `deploy/edge/.env.example`**

```dotenv
# 前端公网域名（与 react-admin.conf 中 server_name、certbot -d 一致）
EDGE_DOMAIN=app.example.com

# API 公网域名（与 nest-admin-api.conf 中 server_name、setup-https-api.sh 一致）
API_DOMAIN=api.example.com

# Let's Encrypt 账号邮箱（certbot --email）
CERTBOT_EMAIL=admin@example.com
```

- [ ] **步骤 8：Commit**

```bash
git add deploy/edge/scripts deploy/edge/.env.example
git commit -m "deploy(edge): add HTTPS setup, renew, verify scripts and env example"
```

---

### 任务 5：`deploy/edge/README.md`

**文件：**
- 创建：`deploy/edge/README.md`（覆盖旧 Caddy 文档）

- [ ] **步骤 1：写入 README**

全文如下（可按实现时微调措辞，不得留「待定」空段）：

```markdown
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
```

- [ ] **步骤 2：Commit**

```bash
git add deploy/edge/README.md
git commit -m "docs(edge): nginx+certbot README for dual-domain setup"
```

---

### 任务 6：删除 `docker-compose.caddy.yml` 并更新 `docker-compose.yml` 注释

**文件：**
- 删除：`docker-compose.caddy.yml`
- 修改：`docker-compose.yml`（仅文件头注释）

- [ ] **步骤 1：删除 Caddy 叠加文件**

```bash
rm -f docker-compose.caddy.yml
```

- [ ] **步骤 2：更新 `docker-compose.yml` 顶部注释**

将开头说明改为强调：**公网 TLS 与域名路由由服务器 `deploy/edge` 的 nginx 维护**；业务栈仅接入 **`edge`**；**不再使用** `docker-compose.caddy.yml` 与 Caddy labels。

示例替换块（整段替换原 1–11 行注释即可）：

```yaml
# 服务器侧 compose：与 workflow 写入的 .env 配合（DOCKER_IMAGE、MYSQL_* 等）。
#
# 本服务不绑定宿主机端口。接入方式：
#   1) 内网：加入 `edge` 的容器可通过 docker DNS 访问 `http://nest-admin:3000`（如 react-admin 的 BACKEND_UPSTREAM）。
#   2) 公网 API 子域名：由服务器 ~/edge/ 的 nginx（deploy/edge）反代到本容器，勿使用 docker-compose.caddy.yml。
```

- [ ] **步骤 3：Commit**

```bash
git add docker-compose.yml docker-compose.caddy.yml
git commit -m "chore(compose): remove caddy overlay; document nginx edge routing"
```

---

### 任务 7：`.github/workflows/deploy.yml`

**文件：**
- 修改：`.github/workflows/deploy.yml`

- [ ] **步骤 1：替换 workflow 全文为下列内容**

```yaml
name: Build, push Docker Hub, deploy ECS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  IMAGE_NAME: nest-admin

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,format=long
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # 前置：服务器 ~/edge/ 上已启动 deploy/edge 的 nginx（网络 edge 已存在）。
      # Secrets：DOCKERHUB_*、SSH_*、DEPLOY_PATH、APP_ENV（多行，等同应用 .env 正文，勿含 DOCKER_IMAGE）
      - name: Copy compose to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "docker-compose.yml"
          target: ${{ secrets.DEPLOY_PATH }}/
          overwrite: true

      - name: Deploy on ECS via SSH
        uses: appleboy/ssh-action@v1.2.0
        env:
          DOCKER_IMAGE: ${{ secrets.DOCKERHUB_USERNAME }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
          APP_ENV: ${{ secrets.APP_ENV }}
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          envs: DOCKER_IMAGE,DEPLOY_PATH,APP_ENV
          script: |
            set -euo pipefail
            cd "$DEPLOY_PATH"
            umask 077
            {
              printf '%s\n' "${APP_ENV//$'\r'/}"
              printf 'DOCKER_IMAGE=%s\n' "$DOCKER_IMAGE"
            } > .env
            docker compose pull
            if ! docker compose up -d --remove-orphans --wait --wait-timeout 180; then
              docker compose ps
              docker compose logs --tail=200 api
              exit 1
            fi
            docker compose ps
            docker image prune -af --filter "until=168h" >/dev/null || true
```

- [ ] **步骤 2：Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): align with react-admin; drop caddy env injection"
```

---

### 任务 8：CORS 解析与配置（TDD）

**文件：**
- 创建：`src/common/configs/parse-cors-origins.ts`
- 创建：`src/common/configs/parse-cors-origins.spec.ts`
- 修改：`src/common/configs/app.config.ts`
- 修改：`src/main.ts`

- [ ] **步骤 1：编写失败测试**

创建 `src/common/configs/parse-cors-origins.spec.ts`：

```typescript
import { parseCorsOrigins } from './parse-cors-origins';

describe('parseCorsOrigins', () => {
    it('returns empty array for undefined', () => {
        expect(parseCorsOrigins(undefined)).toEqual([]);
    });

    it('trims and splits comma-separated origins', () => {
        expect(
            parseCorsOrigins('https://a.example.com, https://b.example.com ')
        ).toEqual(['https://a.example.com', 'https://b.example.com']);
    });

    it('drops empty segments', () => {
        expect(parseCorsOrigins('https://x.com,,,')).toEqual(['https://x.com']);
    });
});
```

- [ ] **步骤 2：运行测试验证失败**

```bash
cd /Users/tangyinxuan/workspace/code/template/nest-admin && pnpm exec jest src/common/configs/parse-cors-origins.spec.ts --no-cache
```

预期：失败，提示找不到模块 `./parse-cors-origins` 或 `parseCorsOrigins` 未定义。

- [ ] **步骤 3：实现 `parse-cors-origins.ts`**

```typescript
export function parseCorsOrigins(raw: string | undefined): string[] {
    return (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}
```

- [ ] **步骤 4：将 `corsOrigins` 并入 `app.config.ts`**

在 `src/common/configs/app.config.ts` 文件顶部增加：

```typescript
import { parseCorsOrigins } from './parse-cors-origins';
```

在 `registerAs('app', () => ({` 返回对象中增加一行（与 `frontendUrl` 相邻）：

```typescript
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
```

- [ ] **步骤 5：在 `main.ts` 启用 CORS**

在 `app.use(cookieParser());` 之后、`if (env !== APP_ENVIRONMENT.PRODUCTION)` 之前插入：

```typescript
    const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [];
    if (corsOrigins.length > 0) {
        app.enableCors({
            origin: corsOrigins,
            credentials: true,
        });
    }
```

- [ ] **步骤 6：运行单元测试与 lint**

```bash
pnpm exec jest src/common/configs/parse-cors-origins.spec.ts --no-cache
pnpm run lint
```

预期：Jest 全部 PASS；ESLint 无新增错误。

- [ ] **步骤 7：Commit**

```bash
git add src/common/configs/parse-cors-origins.ts src/common/configs/parse-cors-origins.spec.ts src/common/configs/app.config.ts src/main.ts
git commit -m "feat(app): optional CORS via CORS_ORIGINS for API subdomain"
```

---

### 任务 9：`.env.template` 与根 `README.md`

**文件：**
- 修改：`.env.template`
- 修改：`README.md`

- [ ] **步骤 1：在 `.env.template` 的 `APP_FRONTEND_URL` 段后追加**

```dotenv
# 可选：浏览器跨域访问 API 子域名时，填写前端源（逗号分隔多个），如 https://app.example.com
# CORS_ORIGINS=https://app.example.com
```

- [ ] **步骤 2：在 `README.md` 末尾追加「Docker 与生产部署」小节**

至少包含：

- 服务器准备 **`deploy/edge`**（nginx+certbot），顺序：edge → **nest-admin** `docker compose up` → **react-admin**。
- **`react-admin`**：`BACKEND_UPSTREAM=http://nest-admin:3000`。
- **API 子域名**：edge 使用 `nest-admin-api` conf；**nest-admin** 设置 **`CORS_ORIGINS`**。
- **CI**：`APP_ENV` Secret 勿含 `DOCKER_IMAGE`；已移除 **`SSL_DOMAIN`** / **`COMPOSE_FILE`**。

- [ ] **步骤 3：Commit**

```bash
git add .env.template README.md
git commit -m "docs: production deploy, CORS_ORIGINS, edge ordering"
```

---

### 任务 10：规格状态与整体验证

**文件：**
- 修改：`docs/superpowers/specs/2026-05-13-nest-admin-edge-nginx-deploy-design.md`

- [ ] **步骤 1：将规格第 3 行附近状态改为「已实现」**

将 `**状态**：待实现` 改为 `**状态**：已实现`。

- [ ] **步骤 2：运行项目测试**

```bash
pnpm run test
pnpm run build
```

预期：`test` 与 `build` 均退出码 0。

- [ ] **步骤 3：Commit**

```bash
git add docs/superpowers/specs/2026-05-13-nest-admin-edge-nginx-deploy-design.md
git commit -m "docs(spec): mark edge nginx design as implemented"
```

---

## 计划自检（已执行）

1. **规格覆盖度：** edge 迁移、双方案路由、workflow、废弃 caddy、CORS、文档均有对应任务。
2. **占位符：** 无「待定/TODO」步骤；脚本与 YAML 为完整正文。
3. **一致性：** 容器名 `nest-admin`/`react-admin` 与规格及现有 compose 一致；证书路径示例与单域名 `certbot` 行为一致。

---

**计划已完成并保存到 `docs/superpowers/plans/2026-05-13-nest-admin-edge-nginx-deploy.md`。两种执行方式：**

**1. 子代理驱动（推荐）** — 每个任务调度一个新的子代理，任务间进行审查，快速迭代（子技能：**subagent-driven-development**）。

**2. 内联执行** — 在当前会话中按任务顺序实现并自行设检查点（子技能：**executing-plans**）。

你更倾向哪一种？
