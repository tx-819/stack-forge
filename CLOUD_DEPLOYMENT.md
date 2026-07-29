# 云服务器部署指南

本机构建镜像 → `deploy/local/deploy.sh` 传到服务器 → Docker Compose 运行。服务器不上源码。

| 组件 | 说明 |
|------|------|
| `apps/api` | NestJS + Prisma + MySQL + Redis |
| `apps/admin` | React/Vite，nginx 静态资源 |
| `deploy/edge` | 宿主机 nginx（80/443、HTTPS、反代） |
| `apps/weapp` | 小程序，不参与 Docker 部署 |

**推荐配置**：Ubuntu 22.04/24.04，内存 ≥2GB（推荐 4GB+），安全组开放 `22/80/443`，**不要**开放 `3306/6379`。

---

## 最短流程

```text
1. 装 Docker → 配镜像加速
2. 域名解析到服务器
3. mkdir /opt/stack-forge/{api,admin}；配置 SSH
4. 上传 deploy/edge → 启动；写 api/.env；写 deploy/local/.env
5. ./deploy/local/deploy.sh all
6. setup-https.sh → 访问 https://admin.example.com
```

---

## 1. 安装 Docker（国内服务器）

官方脚本若失败（`Connection reset by peer`），用阿里云 apt 源：

```bash
sudo apt update && sudo apt install -y ca-certificates curl git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER   # 非 root 需重新登录
docker version && docker compose version
```

### 镜像加速

从 [阿里云 ACR 镜像加速器](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors) 复制专属地址，写入 `/etc/docker/daemon.json`：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://你的专属ID.mirror.aliyuncs.com",
    "https://docker.1panel.live",
    "https://dockerpull.com",
    "https://dockerproxy.cn"
  ]
}
EOF
sudo systemctl daemon-reload && sudo systemctl restart docker
docker pull hello-world && docker run --rm hello-world
```

---

## 2. 域名

将 `admin.example.com`（及可选的 `api.example.com`）解析到服务器公网 IP。

单域名即可：`https://admin.example.com` + `https://admin.example.com/api/...`。

---

## 3. 服务器目录与 SSH

```bash
sudo mkdir -p /opt/stack-forge/{api,admin}
sudo chown -R $USER:$USER /opt/stack-forge
```

本机生成密钥并写入服务器：

```bash
ssh-keygen -t ed25519 -C "stack-forge-deploy" -f ~/.ssh/stack_forge_deploy
ssh-copy-id -i ~/.ssh/stack_forge_deploy.pub user@your-server
ssh -i ~/.ssh/stack_forge_deploy user@your-server
```

可选 `~/.ssh/config`：

```sshconfig
Host stack-forge-server
  HostName your-server
  User user
  IdentityFile ~/.ssh/stack_forge_deploy
```

---

## 4. 部署 Edge Nginx

```bash
scp -r deploy/edge user@your-server:/opt/edge
```

服务器上：

```bash
cd /opt/edge
cp .env.example .env
# 编辑 EDGE_DOMAIN、CERTBOT_EMAIL；独立 API 域名时再填 API_DOMAIN
# 编辑 nginx/conf.d/*.conf 中的占位域名
docker compose up -d   # 创建公共网络 edge
```

---

## 5. 本机与服务器环境变量

**本机** `deploy/local/.env`（见 [`deploy/local/README.md`](deploy/local/README.md)）：

```bash
cp deploy/local/.env.example deploy/local/.env
```

```env
SSH_HOST=your-server
SSH_USER=user
SSH_KEY=~/.ssh/stack_forge_deploy
DEPLOY_PATH=/opt/stack-forge
BACKEND_UPSTREAM=http://nest-admin:3000
```

**服务器** `/opt/stack-forge/api/.env`（首次部署前手工创建，参考 `apps/api/.env.template`）。脚本只会 upsert `DOCKER_IMAGE`，不会覆盖密钥。

要点：

```env
MYSQL_HOST=mysql
REDIS_URL=redis://redis:6379
APP_FRONTEND_URL=https://admin.example.com
# 独立 API 域名时：CORS_ORIGINS=https://admin.example.com
```

admin 的 `.env` 由脚本自动写入，无需事先准备。

---

## 6. 构建并部署

在仓库根目录：

```bash
./deploy/local/deploy.sh all
# 或单独：./deploy/local/deploy.sh api | admin
```

脚本：本机构建 → 打包 scp → 同步 compose → upsert `DOCKER_IMAGE` → `docker load` + `compose up`。API 启动时自动 `prisma migrate deploy`。

后续更新重复执行上述命令即可。

---

## 7. HTTPS

`api` / `admin` 启动后，在服务器：

```bash
cd /opt/edge
sh ./scripts/setup-https.sh all    # 或 admin / api
sh ./scripts/verify-https.sh
sh ./scripts/install-auto-renew-cron.sh --install
```

访问 `https://admin.example.com`。

---

## 8. 排障

| 现象 | 检查 |
|------|------|
| 502 | `admin` 日志；`BACKEND_UPSTREAM=http://nest-admin:3000`；api 是否在跑 |
| API 起不来 | `docker compose logs --tail=200 api`；`.env` 必填项、`MYSQL_HOST`/`REDIS_URL`、密码、migration |
| 证书失败 | 域名 A 记录、安全组 80/443、edge 已 up、`server_name` 正确 |

查看状态：

```bash
cd /opt/stack-forge/api && docker compose ps && docker compose logs -f api
cd /opt/stack-forge/admin && docker compose ps && docker compose logs -f web
cd /opt/edge && docker compose ps && docker compose logs -f nginx
```
