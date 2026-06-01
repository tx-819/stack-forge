# Nest Admin

基于 NestJS 的后台管理系统后端模板，提供完整的 RBAC 权限管理、用户认证、角色与权限配置等能力。

对应前端项目地址：https://github.com/tx-819/react-admin

## 技术栈

| 类别   | 技术                                       |
| ------ | ------------------------------------------ |
| 框架   | NestJS 11                                  |
| 数据库 | MySQL + Prisma ORM                         |
| 缓存   | Redis + ioredis                            |
| 认证   | JWT + Passport (Local / JWT / Magic Login) |
| 队列   | BullMQ                                     |
| 邮件   | Nodemailer                                 |
| 文档   | Swagger / OpenAPI                          |
| 日志   | Pino                                       |

## 项目架构

```
nest-admin/
├── src/
│   ├── app/                    # 应用入口与配置
│   │   ├── app.module.ts      # 根模块
│   │   └── enums/
│   ├── common/                 # 公共模块
│   │   ├── cache/             # Redis 缓存
│   │   ├── configs/           # 配置 (App / DB / Auth / Redis / Email)
│   │   ├── database/          # Prisma 数据库服务
│   │   ├── doc/               # Swagger 文档装饰器
│   │   ├── email/             # 邮件发送
│   │   ├── helper/            # 分页等工具
│   │   ├── logger/            # Pino 日志
│   │   ├── queue/             # BullMQ 队列 (邮件等)
│   │   ├── request/           # 请求处理
│   │   └── response/          # 统一响应格式、拦截器、异常过滤
│   ├── modules/               # 业务模块
│   │   ├── auth/              # 认证模块
│   │   ├── user/              # 用户模块
│   │   ├── role/              # 角色模块
│   │   └── permission/        # 权限模块
│   ├── generated/prisma/      # Prisma 生成客户端
│   ├── main.ts
│   └── swagger.ts
├── prisma/
│   └── schema.prisma          # 数据模型
└── test/
```

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                      Controller 层                           │
│  (Auth / User / Role / Permission 等 REST API)               │
├─────────────────────────────────────────────────────────────┤
│                      Service 层                              │
│  (业务逻辑、Token、权限校验等)                                 │
├─────────────────────────────────────────────────────────────┤
│                      Common 层                               │
│  (Database / Cache / Queue / Email / Response / Logger)      │
├─────────────────────────────────────────────────────────────┤
│                      Prisma / MySQL / Redis                  │
└─────────────────────────────────────────────────────────────┘
```

## 数据模型 (RBAC)

```
User ──┬── UserRole ── Role
       │
       └── 多对多关联

Role ──┬── UserRole ── User
       │
       └── RolePermission ── Permission (菜单/操作)
```

- **User**: 用户
- **Role**: 角色
- **Permission**: 权限（菜单 + 操作，支持树形结构）
- **UserRole**: 用户-角色
- **RolePermission**: 角色-权限

## 实现功能

### 1. 认证模块 (Auth)

| 功能         | 说明                                           |
| ------------ | ---------------------------------------------- |
| 账号密码登录 | 用户名 + 密码，返回 JWT                        |
| 用户注册     | 创建新用户                                     |
| 刷新令牌     | 基于 Cookie 中的 refreshToken 刷新 accessToken |
| 获取当前用户 | `/auth/me`                                     |
| 获取用户菜单 | `/auth/menus` 返回当前用户可访问的菜单树       |
| 邮箱链接登录 | 发送登录邮件，点击链接一键登录                 |

### 2. 用户模块 (User)

| 功能             | 说明         |
| ---------------- | ------------ |
| 用户列表（分页） | 支持查询条件 |
| 用户详情         | 含角色信息   |
| 创建用户         |              |
| 更新用户         |              |
| 删除用户         |              |

### 3. 角色模块 (Role)

| 功能             | 说明                 |
| ---------------- | -------------------- |
| 角色列表（分页） |                      |
| 角色详情         |                      |
| 创建角色         |                      |
| 更新角色         |                      |
| 删除角色         |                      |
| 查询角色权限     | 获取角色已分配的权限 |
| 设置角色权限     | 为角色分配/更新权限  |

### 4. 权限模块 (Permission)

| 功能     | 说明                     |
| -------- | ------------------------ |
| 权限树   | 树形结构，支持菜单与操作 |
| 权限详情 |                          |
| 新增权限 |                          |
| 修改权限 |                          |
| 删除权限 |                          |

### 5. 公共能力

- **统一响应格式**：成功/分页/错误 DTO
- **全局异常过滤**：统一错误返回
- **JWT 全局守卫**：默认需认证，`@Public()` 标记公开接口
- **Swagger 文档**：非生产环境自动启用
- **Pino 日志**：结构化日志
- **Redis 缓存**：Token 等缓存
- **BullMQ 队列**：异步邮件发送
- **分页工具**：通用分页查询

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm
- MySQL
- Redis

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.template .env
```

配置从 `.env` 加载，环境由 `NODE_ENV` 控制：

| 环境 | 命令                            | NODE_ENV    |
| ---- | ------------------------------- | ----------- |
| 开发 | `pnpm dev`                      | development |
| 测试 | `pnpm test` / `pnpm start:test` | test        |
| 生产 | `pnpm prod`                     | production  |

启动前复制为 `.env`，或通过部署脚本切换。

### 数据库迁移

```bash
pnpm migrate
# 或
pnpm prisma:generate
pnpm prisma:push
```

### 启动服务

```bash
# 开发
pnpm dev

# 生产
pnpm build
pnpm prod
```

### API 文档

非生产环境下启动后访问：`http://localhost:3000/docs`

## 脚本说明

| 命令                       | 说明                                     |
| -------------------------- | ---------------------------------------- |
| `pnpm run dev`             | 开发模式（NODE_ENV=development，热重载） |
| `pnpm run prod`            | 生产运行（NODE_ENV=production）          |
| `pnpm run start:test`      | 测试环境运行（NODE_ENV=test）            |
| `pnpm run build`           | 构建                                     |
| `pnpm run migrate`         | Prisma 迁移                              |
| `pnpm run prisma:push`     | 强制同步 schema 到数据库                 |
| `pnpm run prisma:generate` | 生成 Prisma Client                       |
| `pnpm run lint`            | ESLint                                   |

## Docker 与生产部署

1. 在服务器上准备 **`deploy/edge`**（nginx + certbot），监听 80/443 并接入 Docker 网络 **`edge`**。先启动 edge，再启动本仓库 **`nest-admin`** 的 `docker compose up`，最后启动 **`react-admin`**，保证业务容器与 `edge-nginx` 在同一 `edge` 网络上。
2. **`react-admin`**：在部署配置中设置 **`BACKEND_UPSTREAM=http://nest-admin:3000`**，由前端反代将浏览器的 **`/api/*`** 转到本后端。
3. **API 子域名**：在 edge 的 `nest-admin-api` 配置中为 API 域名反代到 **`nest-admin:3000`**；若浏览器直接访问 API 子域名，需在本服务环境变量中设置 **`CORS_ORIGINS`**（例如前端 HTTPS 源，多个用英文逗号分隔）。
4. **CI**：GitHub Actions 使用 Secret **`APP_ENV`** 写入服务器 `.env`（勿包含 **`DOCKER_IMAGE`**，由工作流追加）。已移除 **`SSL_DOMAIN`**、**`COMPOSE_FILE`** 等与 Caddy 叠加相关的注入。
