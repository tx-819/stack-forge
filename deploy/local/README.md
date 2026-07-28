# 本机打包部署

在开发机构建 Docker 镜像，经 `docker save` + `scp` 传到服务器 `docker load` 后 `compose up`。**服务器不放项目源码**，只保留 `docker-compose.yml`、`.env` 与镜像。

## 前置条件

1. 本机已安装并**启动** Docker（macOS 需打开 Docker Desktop，且 `docker info` 正常），且能访问构建所需基础镜像（`node`、`nginx` 等）。
2. 本机可 SSH 登录云服务器（见根目录 [`CLOUD_DEPLOYMENT.md`](../../CLOUD_DEPLOYMENT.md)）。
3. 服务器已安装 Docker / Compose，且 **`deploy/edge` 已启动**（网络 `edge` 存在）；脚本会预检该网络。
4. 服务器已有部署目录，例如 `/opt/stack-forge/api`、`/opt/stack-forge/admin`。
5. **api 首次部署前**：在服务器 `$DEPLOY_PATH/api/.env` 中手工写好 MySQL / JWT 等变量（参考 `apps/api/.env.template`）；脚本会预检必填键，且只会 upsert `DOCKER_IMAGE`，不会整文件覆盖。
6. 默认 `--platform linux/amd64` 构建，避免 Apple Silicon 本机打出 arm64 在 ECS 上无法运行。可通过 `DOCKER_PLATFORM` 覆盖。

## 配置

```bash
cp deploy/local/.env.example deploy/local/.env
# 编辑 SSH_HOST、SSH_USER、SSH_KEY、DEPLOY_PATH、BACKEND_UPSTREAM
```

`deploy/local/.env` 已被 gitignore，勿提交。

## 用法

在 monorepo **根目录**执行：

```bash
./deploy/local/deploy.sh api      # 仅后端
./deploy/local/deploy.sh admin    # 仅后台前端
./deploy/local/deploy.sh all      # 先 api 再 admin
```

镜像命名：`stack-forge/<app>:<git-short-sha>`；工作区有未提交改动时 tag 带 `-dirty-<时间戳>`。

## 流程摘要

1. 预检服务器 `edge` 网络；部署 api 时预检 `.env` 必填键
2. `docker build --platform linux/amd64 -f apps/<app>/Dockerfile`（context 为仓库根）
3. `docker save | gzip` → scp 到服务器 `/tmp`
4. scp 对应 `docker-compose.yml`
5. 远程 upsert `.env` 中的 `DOCKER_IMAGE`（admin 另写 `BACKEND_UPSTREAM`）
6. `docker load` → `docker compose up -d --remove-orphans --wait`
7. 删除临时 tar；清理悬空层，并删除同 app 的旧 `stack-forge/*` tag
