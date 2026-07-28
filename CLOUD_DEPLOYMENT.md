# 云服务器从零部署指南

本文档说明如何把当前项目从零部署到一台云服务器。

当前项目是一个 pnpm monorepo：

- `apps/api`：后端，NestJS + Prisma + MySQL + Redis
- `apps/admin`：后台前端，React/Vite，构建后由 nginx 提供静态资源
- `apps/weapp`：uni-app x 小程序项目，需要在 HBuilderX 中单独开发和构建，不参与服务器 Docker 部署
- `deploy/edge`：服务器最外层 nginx + certbot，用于监听 `80/443`、申请 HTTPS 证书、反向代理到业务容器
- `deploy/local`：本机构建镜像并用 `docker save` + `scp` 部署到服务器（不上源码）

推荐生产部署方式：

1. 云服务器只负责运行 Docker 容器（compose + `.env` + 镜像）。
2. 在开发本机构建 `api` / `admin` 镜像。
3. 通过 `deploy/local/deploy.sh` 将镜像打包传到服务器并 `compose up`。

## 1. 准备云服务器

推荐配置：

```text
系统：Ubuntu 22.04 / Ubuntu 24.04
内存：至少 2GB，推荐 4GB+
开放端口：22、80、443
不要开放：3306、6379
```

### 1.1 国内服务器安装 Docker

如果服务器在国内，直接执行官方脚本：

```bash
curl -fsSL https://get.docker.com | sudo sh
```

可能出现：

```text
curl: (35) Recv failure: Connection reset by peer
```

这是服务器访问 Docker 官方安装脚本被重置导致的。推荐改用国内 apt 源安装 Docker。

以下命令适用于 Ubuntu 22.04 / 24.04。

如果当前登录用户是 `root`，可以去掉命令里的 `sudo`。

安装基础依赖：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
```

添加 Docker 的国内 apt 源。这里使用阿里云镜像源：

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

安装 Docker Engine 和 Docker Compose 插件：

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

允许当前用户执行 Docker：

```bash
sudo usermod -aG docker $USER
```

如果当前用户是 `root`，这一步可以不做。普通用户执行后需要退出 SSH 并重新登录。

确认 Docker 可用：

```bash
docker version
docker compose version
```

### 1.2 配置 Docker 国内镜像加速

本机构建或服务器拉取基础镜像（如 `mysql`、`redis`、`nginx`）时，国内访问 Docker Hub 可能较慢，建议配置 registry mirror。

优先使用你自己的阿里云镜像加速地址：

1. 打开阿里云控制台。
2. 进入「容器镜像服务 ACR」。
3. 找到「镜像工具」->「镜像加速器」。
4. 复制你的专属加速地址，通常形如：

```text
https://xxxxxx.mirror.aliyuncs.com
```

在服务器（以及需要的话在本机）创建 Docker daemon 配置：

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
```

重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

检查配置是否生效：

```bash
docker info | grep -A 10 "Registry Mirrors"
```

测试拉取镜像：

```bash
docker pull hello-world
docker run --rm hello-world
```

## 2. 准备域名

至少准备一个后台域名：

```text
admin.example.com -> 云服务器公网 IP
```

可选再准备一个 API 域名：

```text
api.example.com -> 云服务器公网 IP
```

如果只通过后台前端的 `/api` 路径访问后端，可以只使用一个后台域名：

```text
https://admin.example.com
https://admin.example.com/api/...
```

## 3. 创建服务器部署目录

假设部署根目录为 `/opt/stack-forge`：

```bash
sudo mkdir -p /opt/stack-forge/api
sudo mkdir -p /opt/stack-forge/admin
sudo chown -R $USER:$USER /opt/stack-forge
```

本机部署脚本会把对应 app 的 `docker-compose.yml` 与镜像传到：

- `/opt/stack-forge/api`
- `/opt/stack-forge/admin`

**不上源码**；密钥只放在服务器各目录的 `.env`。

## 4. 配置 SSH 登录云服务器

在部署 Edge Nginx 与本机 `deploy.sh` 之前，先确保本地电脑可以通过 SSH 登录云服务器。

以下示例中：

```text
user = 云服务器登录用户，例如 root / ubuntu
your-server = 云服务器公网 IP 或域名
```

### 4.1 本地生成 SSH key

如果本地还没有可用的 SSH key，可以执行：

```bash
ssh-keygen -t ed25519 -C "stack-forge-deploy" -f ~/.ssh/stack_forge_deploy
```

执行后会生成：

```text
~/.ssh/stack_forge_deploy      # 私钥，自己保存，不能泄露
~/.ssh/stack_forge_deploy.pub  # 公钥，可以放到服务器
```

### 4.2 把公钥添加到云服务器

如果云厂商控制台支持「SSH 密钥」或「导入密钥对」，可以把 `~/.ssh/stack_forge_deploy.pub` 的内容添加到服务器。

如果你当前已经能用密码登录服务器，也可以执行：

```bash
ssh-copy-id -i ~/.ssh/stack_forge_deploy.pub user@your-server
```

如果没有 `ssh-copy-id`，可以手动登录服务器后追加公钥：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '这里替换成 stack_forge_deploy.pub 的完整内容' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 4.3 测试 SSH 登录

本地执行：

```bash
ssh -i ~/.ssh/stack_forge_deploy user@your-server
```

能够进入服务器 shell 就说明 SSH 配置成功。

如果登录失败，优先检查：

- 云服务器安全组是否开放 `22`
- 使用的用户名是否正确，例如 `root` / `ubuntu`
- 公钥是否已经写入服务器用户的 `~/.ssh/authorized_keys`
- 私钥文件权限是否正确

修复私钥权限：

```bash
chmod 600 ~/.ssh/stack_forge_deploy
```

### 4.4 可选：配置 SSH config

为了后续命令更短，可以在本地 `~/.ssh/config` 添加：

```sshconfig
Host stack-forge-server
  HostName your-server
  User user
  IdentityFile ~/.ssh/stack_forge_deploy
```

之后可以直接登录：

```bash
ssh stack-forge-server
```

复制文件也可以写成：

```bash
scp -r deploy/edge stack-forge-server:/opt/edge
```

## 5. 部署 Edge Nginx

Edge 是服务器最外层的 nginx，只部署一份。它负责监听宿主机的 `80/443`，终止 TLS，并反向代理到业务容器。

从本地项目根目录复制 `deploy/edge` 到服务器：

```bash
scp -r deploy/edge user@your-server:/opt/edge
```

登录服务器后执行：

```bash
cd /opt/edge
cp .env.example .env
```

编辑 `.env`：

```env
EDGE_DOMAIN=admin.example.com
API_DOMAIN=api.example.com
CERTBOT_EMAIL=your-email@example.com
```

如果不使用独立 API 域名，可以不配置 `API_DOMAIN`，只使用后台域名下的 `/api` 代理。

编辑 nginx 域名配置：

```bash
vim nginx/conf.d/admin.conf
vim nginx/conf.d/api.conf
```

把配置中的占位域名替换为真实域名：

```text
app.example.com -> admin.example.com
api.example.com -> api.example.com
```

启动 Edge：

```bash
docker compose up -d
```

这一步会创建公共 Docker 网络：

```text
edge
```

后续 `api` 和 `admin` 容器都会加入这个网络，并通过容器名互相访问。

## 6. 准备本机部署配置

在仓库根目录：

```bash
cp deploy/local/.env.example deploy/local/.env
```

编辑 `deploy/local/.env`：

```env
SSH_HOST=your-server
SSH_USER=user
SSH_KEY=~/.ssh/stack_forge_deploy
DEPLOY_PATH=/opt/stack-forge
BACKEND_UPSTREAM=http://nest-admin:3000
```

详见 [`deploy/local/README.md`](deploy/local/README.md)。

## 7. 准备服务器上的 api `.env`

脚本部署时**只会 upsert `DOCKER_IMAGE`**（admin 另写 `BACKEND_UPSTREAM`），不会用本机文件整份覆盖服务器密钥。

因此 **首次部署 api 前**，在服务器创建 `/opt/stack-forge/api/.env`，内容参考 `apps/api/.env.template`。

生产环境示例：

```env
APP_NAME=nest-admin
APP_LOG_LEVEL=info
APP_FRONTEND_URL=https://admin.example.com

MYSQL_USER=deploy
MYSQL_PASSWORD=change-this-password
MYSQL_ROOT_PASSWORD=change-this-root-password
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=nest-admin

REDIS_URL=redis://redis:6379

AUTH_ACCESS_TOKEN_SECRET=change-this-to-a-long-random-string
AUTH_ACCESS_TOKEN_EXP=15m
AUTH_REFRESH_TOKEN_TTL=604800
AUTH_MAGIC_LOGIN_TOKEN_TTL=300

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com

WECHAT_MINI_APP_ID=
WECHAT_MINI_APP_SECRET=
TZ=Asia/Shanghai
```

生产环境必须注意：

```env
MYSQL_HOST=mysql
REDIS_URL=redis://redis:6379
```

这里要使用 Docker Compose 服务名，不要写 `localhost`。

如果使用独立 API 域名，并且浏览器会直接访问 `https://api.example.com`，还需要配置 CORS：

```env
CORS_ORIGINS=https://admin.example.com
```

`DOCKER_IMAGE` 可先不写，首次执行 `deploy.sh api` 时会自动写入。

admin 目录的 `.env` 一般由脚本写入 `DOCKER_IMAGE` 与 `BACKEND_UPSTREAM`，无需事先准备密钥文件。

## 8. 本机构建并部署

在 monorepo **根目录**执行：

```bash
./deploy/local/deploy.sh api
./deploy/local/deploy.sh admin
# 或一次部署两个：
./deploy/local/deploy.sh all
```

脚本会：

1. 本机 `docker build`（镜像名形如 `stack-forge/api:<git-sha>`）
2. `docker save | gzip` 后 scp 到服务器
3. 同步对应 `docker-compose.yml`
4. 远程 upsert `.env` 中的 `DOCKER_IMAGE`
5. `docker load` 后 `docker compose up -d --remove-orphans --wait`

API 容器启动时会自动执行：

```bash
prisma migrate deploy
```

因此数据库迁移会随 API 容器启动自动执行。

## 9. 申请 HTTPS 证书

等 `api` 和 `admin` 容器都启动后，回到服务器执行：

```bash
cd /opt/edge
sh ./scripts/setup-https.sh admin
```

如果使用独立 API 域名：

```bash
sh ./scripts/setup-https.sh api
```

也可以一次性处理全部域名：

```bash
sh ./scripts/setup-https.sh all
```

验证 HTTPS：

```bash
sh ./scripts/verify-https.sh
```

安装证书自动续期 cron：

```bash
sh ./scripts/install-auto-renew-cron.sh --install
```

## 10. 检查服务状态

检查 API：

```bash
cd /opt/stack-forge/api
docker compose ps
docker compose logs -f api
```

检查后台前端：

```bash
cd /opt/stack-forge/admin
docker compose ps
docker compose logs -f web
```

检查 Edge：

```bash
cd /opt/edge
docker compose ps
docker compose logs -f nginx
```

浏览器访问：

```text
https://admin.example.com
```

后台前端会通过自身 nginx 把 `/api` 代理到后端：

```text
https://admin.example.com/api/...
```

对应的容器内上游地址是：

```text
http://nest-admin:3000
```

## 11. 后续更新

改动后端或前端后，在本机再次执行对应脚本即可：

```bash
./deploy/local/deploy.sh api      # 仅后端
./deploy/local/deploy.sh admin    # 仅后台前端
./deploy/local/deploy.sh all      # 两者都部署
```

不需要把源码放到服务器，也不依赖 Docker Hub / GitHub Actions。

## 12. 常见问题

### 访问后台 502

优先检查：

```bash
cd /opt/stack-forge/admin
docker compose logs -f web
```

确认 `BACKEND_UPSTREAM` 是：

```text
http://nest-admin:3000
```

然后确认 API 容器已启动：

```bash
cd /opt/stack-forge/api
docker compose ps
```

### API 启动失败

查看 API 日志：

```bash
cd /opt/stack-forge/api
docker compose logs --tail=200 api
```

重点检查：

- 服务器 `.env` 是否缺少必填变量
- `MYSQL_HOST` 是否为 `mysql`
- `REDIS_URL` 是否为 `redis://redis:6379`
- MySQL 密码是否和 `.env` 一致
- Prisma migration 是否执行失败

### HTTPS 证书申请失败

检查：

- 域名 A 记录是否已经解析到服务器公网 IP
- 云服务器安全组是否开放 `80` 和 `443`
- `/opt/edge` 是否已经 `docker compose up -d`
- `nginx/conf.d/*.conf` 中的 `server_name` 是否为真实域名

### 不要直接开放数据库端口

项目的 MySQL 和 Redis 只绑定在服务器本机：

```text
127.0.0.1:3306
127.0.0.1:6379
```

云服务器安全组不要对公网开放 `3306` 和 `6379`。如果需要本地连接数据库，使用 SSH 隧道。

## 13. 最短部署顺序

```text
1. 购买云服务器，开放 22/80/443。
2. 安装 Docker 和 Docker Compose。
3. 域名解析到服务器。
4. 创建 /opt/stack-forge/api 和 /opt/stack-forge/admin。
5. 配置本地到云服务器的 SSH 登录。
6. 上传 deploy/edge 到 /opt/edge，并启动 docker compose up -d。
7. 配置 deploy/local/.env；在服务器准备 api/.env。
8. 本机执行 ./deploy/local/deploy.sh all。
9. 在 /opt/edge 执行 setup-https.sh。
10. 访问 https://admin.example.com。
```
