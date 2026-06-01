# 部署（Monorepo 共用）

本目录存放**与具体 app 无关**的服务器侧配置，供 `apps/api`、`apps/admin` 等业务栈共用。

| 路径 | 说明 |
| --- | --- |
| [`edge/`](edge/) | 宿主机 **80/443** 的 nginx + certbot（Docker 网络 `edge`），反代到 `react-admin`、`nest-admin` 等容器 |

业务镜像与 compose 仍在各 app 目录（`apps/api/docker-compose.yml`、`apps/admin/docker-compose.yml`），由 GitHub Actions [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) 部署。

**Edge 仅首次在服务器手工部署一份**（例如 `/opt/edge`），详见 [`edge/README.md`](edge/README.md)。
