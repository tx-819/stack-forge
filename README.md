# Template Monorepo

基于 pnpm workspace 的单仓库，整合后端、后台前端与移动端三个项目。

## 项目结构

```text
.
├── pnpm-workspace.yaml      # 工作区声明（apps/*、packages/*）
├── package.json             # 根级聚合脚本
├── deploy/                  # 服务器共用部署
│   └── edge/                # nginx + certbot，宿主机 80/443，Docker 网络 edge
└── apps/
    ├── api/                 # 后端：NestJS 11 + Prisma + MariaDB + Redis/BullMQ + JWT + Swagger
    ├── admin/               # 后台前端：React 19 + Vite 7 + Ant Design 6 + TailwindCSS 4
    └── weapp/               # 移动端：uni-app + Vue 3 + Wot UI
```

## 环境要求

- Node.js >= 22
- pnpm 10.33.0（已在 `packageManager` 中固定，建议用 corepack：`corepack enable`）
- 后端运行需要 MariaDB / MySQL 与 Redis（详见 `apps/api/README.md` 与 `.env.template`）
- 微信小程序开发需安装微信开发者工具

## 安装依赖

在仓库根目录执行一次即可安装全部工作区依赖：

```bash
pnpm install
```

## 常用脚本（根目录运行）

| 命令                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| `pnpm dev`          | 用 concurrently 同时启动 api + admin（带颜色前缀区分日志）   |
| `pnpm dev:server`   | 仅启动后端开发服务（默认 `http://localhost:3000`）           |
| `pnpm dev:web`      | 仅启动前端开发服务（默认 `http://localhost:5173`）           |
| `pnpm dev:weapp`    | 启动微信小程序开发模式                                       |
| `pnpm dev:weapp:h5` | 启动 weapp H5 开发模式（默认 `http://localhost:5174`）       |
| `pnpm build:server` | 构建后端                                                     |
| `pnpm build:web`    | 构建前端                                                     |
| `pnpm build:weapp`  | 构建微信小程序                                               |
| `pnpm build`        | 递归构建所有工作区项目                                       |
| `pnpm lint`         | 递归执行各项目 lint                                          |
| `pnpm typecheck`    | 递归执行各项目 typecheck                                     |

也可用 `pnpm --filter <包名> <脚本>` 直接操作单个项目：

- 后端包名：`api`
- 前端包名：`admin`
- 移动端包名：`weapp`

## 前后端联调

前端 `apps/admin/vite.config.ts` 已将 `/api` 代理到 `http://localhost:3000`。推荐一条命令联调：

```bash
pnpm dev
```

同一终端并行跑 admin 与 api，日志带绿色 `[admin]` / 蓝色 `[api]` 前缀。api 已关闭 Nest 框架启动刷屏，并用 `--preserveWatchOutput` 避免 watch 清屏把 admin 日志冲掉。`Ctrl+C` 会一并退出。

若只想单独起一个服务：

```bash
pnpm dev:server
pnpm dev:web
```

## 移动端

weapp 已纳入 pnpm workspace，使用 CLI 开发：

```bash
pnpm dev:weapp        # 微信小程序
pnpm dev:weapp:h5     # H5（/api 代理到本地后端）
```

H5 联调时先启动后端，再运行 `pnpm dev:weapp:h5`。小程序/App 请在 `apps/weapp/.env` 中配置 `VITE_API_BASE_URL` 指向可访问的后端地址。

重新生成 Alova API 客户端（需 api 运行中，或更新 `apps/weapp/openapi.json` 后执行）：

```bash
pnpm --filter weapp alova-gen
```

## 部署

生产环境部署（云服务器、Docker、Edge、GitHub Secrets、HTTPS、CI/CD 等）详见 **[云服务器从零部署指南](https://github.com/tx-819/stack-forge/blob/main/CLOUD_DEPLOYMENT.md)**。

本地仓库内也可直接阅读 [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md).
