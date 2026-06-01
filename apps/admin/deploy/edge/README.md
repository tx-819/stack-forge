# Edge 反向代理栈（nginx + certbot）

服务器上所有项目共用的「前台」：**在宿主机监听 80/443**，终止 TLS，并将流量反代到接入 **`edge`** 网络的各业务容器（例如 **`react-admin:80`**）。

与旧版 **caddy-docker-proxy** 的差异：路由与证书 **不再** 通过 Docker labels 自动生成，须在 **`nginx/conf.d/`** 内 **显式维护** `server` 配置；每新增一个对外域名，通常新增一份 conf（档 B）并执行一次 **certbot**。

运维脚本集中在 **`scripts/`** 目录（在 edge 根目录执行时需带路径，例如 **`sh ./scripts/setup-https.sh`**）。

## 前置条件

- 域名 **A 记录**（或 AAAA）指向本机公网 IP。
- 本机 **80、443** 未被其他进程占用；若曾运行旧 Caddy edge，需先 **`docker compose down`** 释放端口。
- 业务容器与 **`edge-nginx`** 在同一 Docker 网络 **`edge`** 上，且业务 **`expose`** 了 nginx 要访问的端口（一般为 **80**）。

## 首次部署（顺序重要）

### 1. 拷贝到服务器

将本目录拷到服务器，例如 `/opt/edge`。

```bash
scp -i 你的ssh私钥 -r deploy/edge/ 用户名@服务器IP:/opt
```

### 2. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env：EDGE_DOMAIN、CERTBOT_EMAIL 等
# 后续命令将直接读取这些变量，避免手工替换字符串
```

### 3. 启动 edge 栈（创建 `edge` 网络并启动 nginx）

```bash
cd /opt/edge
docker compose up -d
docker network ls | grep '\bedge\b'
docker compose ps
```

说明：**`certbot` 服务**在 `docker compose up -d` 后可能显示为 **Exited**，且 **`restart: "no"`**，这是预期现象；日常请使用 **`docker compose run --rm certbot`**。

### 4. 启动业务项目

在业务仓库目录（已配置 **`networks.edge.external: true`**）：

```bash
docker compose up -d
```

确认业务容器名（如 **`react-admin`**）与 **`nginx/conf.d/react-admin.conf`** 中的 **`proxy_pass`** 一致。

### 5. 首次申请证书（HTTP-01 + webroot）

确保 **`nginx/conf.d/react-admin.conf`** 仍为 **仅监听 80** 的版本（含 **`/.well-known/acme-challenge/`**）。

```bash
sh ./scripts/setup-https.sh
```

脚本会自动读取 `.env` 里的 **`EDGE_DOMAIN`** 与 **`CERTBOT_EMAIL`**，并依次执行：

- `certbot certonly` 申请证书
- 复制 `react-admin.conf.https.example` 覆盖 `react-admin.conf`
- 将文件中的 `app.example.com` 替换为 `$EDGE_DOMAIN`
- `nginx -t` 校验并 `nginx -s reload`

如需排查可直接打开脚本：`scripts/setup-https.sh`。

### 6. 启用 HTTPS

仓库内默认 **`react-admin.conf` 为仅 80**（无证书也能启动）。证书签发成功后：

1. `scripts/setup-https.sh` 已自动完成模板覆盖、域名替换、配置校验与重载。
2. 如需手动复核，可再次执行：

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

### 7. 验证

```bash
cd /opt/edge
sh ./scripts/verify-https.sh
```

脚本会读取 `.env` 中的 **`EDGE_DOMAIN`**，对 **HTTP / HTTPS** 各发一次 `HEAD` 请求并打印响应头。

浏览器打开站点，测试 SPA 子路由刷新与 **`/api/`** 接口。

## 手动续期

```bash
cd /opt/edge
sh ./scripts/renew-cert.sh
```

等价于：`certbot renew`（经 compose）成功后 **`nginx -s reload`**（脚本内使用 **`exec -T`**，无终端也可用）。

演练（不修改证书，仅模拟续期流程）：

```bash
cd /opt/edge
sh ./scripts/renew-cert.sh --dry-run
```

## 自动续期（推荐：宿主机定时任务）

**建议把调度放在宿主机**（`cron` 或 **systemd timer**）：定时调用 **`scripts/renew-cert.sh`**，不增加常驻容器，日志与排障都在系统侧完成。

Let’s Encrypt 在证书临近到期时才会真正续签；`certbot renew` 会跳过尚不需要的证书。续签成功后应 **`nginx -s reload`**，否则进程可能仍持有旧文件句柄（视环境而定，reload 最稳妥）。

### 一键写入 cron（推荐）

若你曾用旧路径（例如 **`/opt/edge/renew-cert.sh`**）写过 crontab，升级本目录后请改为 **`/opt/edge/scripts/renew-cert.sh`**，或重新执行一次 **`scripts/install-auto-renew-cron.sh --install`**（会先检测是否已存在同路径条目）。

在 edge 目录执行（**用跑 `docker compose` 的同一 Linux 用户**，且该用户已在 **`docker` 组**内）：

```bash
cd /opt/edge
sh ./scripts/renew-cert.sh --dry-run
sh ./scripts/install-auto-renew-cron.sh --install
```

- 默认 **每天 03:12** 执行一次；默认日志：**`$HOME/logs/edge-certbot-renew.log`**（脚本会创建目录）。
- 自定义时间与日志：

```bash
CRON_SCHEDULE="0 4 * * *" CRON_LOG="/var/log/edge-certbot-renew.log" sh ./scripts/install-auto-renew-cron.sh --install
```

（若日志在 **`/var/log`**，需保证当前用户对该文件可写，或改用 **`$HOME/logs/...`**。）

只查看将写入的内容、不修改 crontab：

```bash
sh ./scripts/install-auto-renew-cron.sh
```

## 档 B：同一宿主机多站点

前提：新业务容器已加入 **`edge`** 网络，并有稳定 **`container_name`**（或你能在 `proxy_pass` 里写对的容器名）；边缘仍只有这一套 **`edge-nginx`**，多站点 = 多个 **`server` 块**（通常 **一域名一个 `.conf` 文件**）。

### 1. DNS

新域名 **A/AAAA** 指向本机（与第一台站相同公网 IP）。

### 2. Nginx：新增站点配置

在 **`nginx/conf.d/`** 新建例如 **`other-site.conf`**（文件名随意，以 **`.conf`** 结尾即可被加载）。

- **仅 HTTP、尚未有证书时**（便于先 `certonly`）：参考现有 **`react-admin.conf`**——`listen 80`、`server_name 新域名`、`/.well-known/acme-challenge/` 用 **`root /var/www/certbot`**，`location /` **`proxy_pass http://上游容器名:端口;`**，并带上与现网一致的 **`proxy_set_header`**（含 **`Upgrade` / `Connection`**）。
- **已有证书、要 HTTPS**：可复制 **`react-admin.conf.https.example`** 的结构改两份：把 **`server_name`**、**`ssl_certificate` 路径**（`live/<域名>/`）改成新域名；**80** 上保留 ACME 路径 + 其余跳 **HTTPS**；**443** 上 **`proxy_pass`** 指向新业务容器。

若 **`edge-nginx` 启动时上游容器还不存在**，为避免解析失败导致 nginx 起不来，可用 **`resolver 127.0.0.11`** + **变量** `proxy_pass`（与仓库内应用 nginx 反代后端写法相同）。

### 3. 证书

**每域名一张证书（最常见）：**

```bash
cd /opt/edge
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "新域名" \
  --email "你的邮箱" \
  --agree-tos --non-interactive
```

**一张证书覆盖多个域名（SAN）**：`certbot` 多次 **`-d`**；nginx 里 **`server_name`** 与证书 SAN 一致。

### 4. 重载

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

### 5. 自动续期

现有 **`scripts/renew-cert.sh`** 会 **`certbot renew`** 卷内**所有**证书，一般**无需**为每个新站点单独加 cron；仍建议偶发执行 **`sh ./scripts/renew-cert.sh --dry-run`** 做演练。

## 排障

```bash
docker compose logs nginx
docker compose exec nginx nginx -t
```

查看当前加载的配置文件目录：`./nginx/conf.d`（挂载为容器内 **`/etc/nginx/conf.d`**）。

## 回滚

停止本栈、恢复旧 **Caddy / caddy-docker-proxy** 的 compose 与数据卷（若仍保留备份）。业务侧若临时恢复 **`caddy.*` labels** 需自行与旧栈对齐，不在本仓库规格范围内。
