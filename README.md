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

## 部署

生产环境部署（云服务器、Docker、Edge、GitHub Secrets、HTTPS、CI/CD 等）详见 **[云服务器从零部署指南](https://github.com/tx-819/stack-forge/blob/main/CLOUD_DEPLOYMENT.md)**。

本地仓库内也可直接阅读 [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md)。
