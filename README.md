# Template Monorepo

基于 pnpm workspace 的单仓库，整合后端、后台前端与移动端三个项目。

## 项目结构

```text
.
├── pnpm-workspace.yaml      # 工作区声明（apps/api、apps/admin）
├── package.json             # 根级聚合脚本
├── deploy/                  # 服务器共用部署
│   └── edge/                # nginx + certbot，宿主机 80/443，Docker 网络 edge
└── apps/
    ├── api/                 # 后端：NestJS 11 + Prisma + MariaDB + Redis/BullMQ + JWT + Swagger
    ├── admin/               # 后台前端：React 19 + Vite 7 + Ant Design 6 + TailwindCSS 4
    └── weapp/               # 移动端：uni-app x（uvue），在 HBuilderX 中开发
```

> 说明：`weapp` 是 HBuilderX 的 uni-app x 工程，没有 `package.json`，不纳入 pnpm 工作区，需在 HBuilderX 中单独打开/构建。

## 环境要求

- Node.js >= 22
- pnpm 10.33.0（已在 `packageManager` 中固定，建议用 corepack：`corepack enable`）
- 后端运行需要 MariaDB / MySQL 与 Redis（详见 `apps/api/README.md` 与 `.env.template`）
- 移动端需要 HBuilderX

## 安装依赖

在仓库根目录执行一次即可为 `api` 与 `admin` 安装全部依赖：

```bash
pnpm install
```

## 常用脚本（根目录运行）

| 命令                | 说明                                             |
| ------------------- | ------------------------------------------------ |
| `pnpm dev:server`   | 启动后端开发服务（默认 `http://localhost:3000`） |
| `pnpm dev:web`      | 启动前端开发服务（默认 `http://localhost:5173`） |
| `pnpm build:server` | 构建后端                                         |
| `pnpm build:web`    | 构建前端                                         |
| `pnpm build`        | 递归构建所有工作区项目                           |
| `pnpm lint`         | 递归执行各项目 lint                              |

也可用 `pnpm --filter <包名> <脚本>` 直接操作单个项目：

- 后端包名：`api`
- 前端包名：`admin`

## 前后端联调

前端 `apps/admin/vite.config.ts` 已将 `/api` 代理到 `http://localhost:3000`，因此先启动后端再启动前端即可直接联调：

```bash
pnpm dev:server   # 终端 1
pnpm dev:web      # 终端 2
```

## 移动端

在 HBuilderX 中打开 `apps/weapp` 目录进行开发、运行与发行（小程序 / App）。

## CI/CD

工作流位于 `.github/workflows/`：

| 文件         | 触发时机                                 | 作用                                                 |
| ------------ | ---------------------------------------- | ---------------------------------------------------- |
| `ci.yml`     | 向 `main` 开 PR，或 PR 内 push 新 commit | PR 门禁：路径过滤 → install → lint → build（不部署） |
| `deploy.yml` | push 到 `main`，或 Actions 手动 Run      | 路径过滤 → Docker 构建推送 → SSH 部署到 ECS          |

`deploy.yml` 会根据改动路径决定部署 `api` 还是 `admin`（改 `pnpm-lock.yaml` 等共享文件时两者都会部署）。`ci.yml` 不需要任何 Secret。

## GitHub Repository Secrets

部署前在 GitHub 仓库配置：**Settings → Secrets and variables → Actions → Repository secrets**。

### 总览

| 分类                            | 数量     | 说明                         |
| ------------------------------- | -------- | ---------------------------- |
| 共用（Docker + SSH + 部署目录） | 6 个     | `api` / `admin` 部署都会用到 |
| 仅 api                          | 1 个     | 应用环境变量                 |
| 仅 admin                        | 1 个     | 后端上游                    |
| **合计**                        | **8 个** |                              |

### 共用 Secrets

| Secret 名称          | 用途                        | 示例 / 说明                                                                                 |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | 登录 Docker Hub、镜像名前缀 | Docker Hub 用户名                                                                           |
| `DOCKERHUB_TOKEN`    | Docker Hub 访问令牌         | 在 Docker Hub → Account Settings → Security 创建 Access Token（勿用登录密码）               |
| `SSH_HOST`           | ECS 服务器 IP 或域名        | 如 `47.x.x.x`                                                                               |
| `SSH_USER`           | SSH 登录用户名              | 如 `root`、`ubuntu`                                                                         |
| `SSH_PRIVATE_KEY`    | SSH 私钥全文                | 含 `-----BEGIN ... KEY-----` 整段，对应服务器 `authorized_keys` 中的公钥                    |
| `DEPLOY_PATH`        | 服务器上的部署根目录        | 如 `/home/ubuntu/deploy`；workflow 自动使用 `$DEPLOY_PATH/api`、`$DEPLOY_PATH/admin` 子目录 |

推送镜像命名（workflow 自动使用）：

- api：`{DOCKERHUB_USERNAME}/api:{commit_sha}` 与 `:latest`
- admin：`{DOCKERHUB_USERNAME}/admin:{commit_sha}` 与 `:latest`

### 仅 api 部署

| Secret 名称 | 用途                                     | 示例 / 说明                                                                                                   |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`   | 写入服务器 `.env` 的应用配置（**多行**） | 内容参考 [apps/api/.env.template](apps/api/.env.template)；**不要**包含 `DOCKER_IMAGE`（workflow 会自动追加） |

`APP_ENV` 生产环境要点（与 [apps/api/docker-compose.yml](apps/api/docker-compose.yml) 配合）：

- `MYSQL_HOST=mysql`、`REDIS_URL=redis://redis:6379` 使用 compose 内**服务名**，不是 `localhost`
- 至少配置：`APP_FRONTEND_URL`、MySQL/Redis、JWT `AUTH_*`、SMTP 等
- 使用微信小程序登录时，补充 `WECHAT_MINI_APP_ID`、`WECHAT_MINI_APP_SECRET`

### 仅 admin 部署

| Secret 名称        | 用途                                                                                                          | 示例 / 说明                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `BACKEND_UPSTREAM` | 容器内 nginx 反代的后端地址                                                                                   | `http://nest-admin:3000`（指向 api 的 **container_name**，见 api 的 docker-compose） |

### 与旧单仓库 Secrets 的对应

| 旧 Secret（单仓库时代）          | 新 Secret（monorepo）                     |
| -------------------------------- | ----------------------------------------- |
| `DEPLOY_PATH`                    | 不变；作为根目录，子目录为 `api`、`admin` |
| `APP_ENV`                        | 不变                                      |
| `BACKEND_UPSTREAM`               | 不变                                      |
| `DOCKERHUB_*`、`SSH_*`           | 不变                                      |

### 服务器前置条件

- 已安装 Docker 与 Docker Compose
- **Edge 栈（一次性）**：将仓库根 [`deploy/edge/`](deploy/edge/) 拷到服务器（如 `/opt/edge`），按 [`deploy/edge/README.md`](deploy/edge/README.md) 启动 nginx + certbot，创建 Docker 网络 **`edge`**
- `$DEPLOY_PATH/api`、`$DEPLOY_PATH/admin` 子目录存在（或首次部署前在服务器创建），SSH 用户可执行 `docker compose`
- 服务器可拉取 Docker Hub 上的 `{用户名}/api`、`{用户名}/admin` 镜像
- 部署顺序建议：**edge** → **api** compose → **admin** compose（后两者由 Actions 更新镜像）

### 配置核对清单

```text
[ ] DOCKERHUB_USERNAME
[ ] DOCKERHUB_TOKEN
[ ] SSH_HOST
[ ] SSH_USER
[ ] SSH_PRIVATE_KEY
[ ] DEPLOY_PATH
[ ] APP_ENV（多行，生产环境变量）
[ ] BACKEND_UPSTREAM（http://nest-admin:3000）
```
