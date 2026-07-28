# 部署（Monorepo 共用）

本目录存放**与具体 app 无关**的服务器侧配置，以及本机打包部署脚本。

| 路径 | 说明 |
| --- | --- |
| [`edge/`](edge/) | 宿主机 **80/443** 的 nginx + certbot（Docker 网络 `edge`），反代到 `react-admin`、`nest-admin` 等容器 |
| [`local/`](local/) | 本机 `docker build` → `save` → `scp` → 服务器 `load` + `compose up`（不上源码） |

业务 compose 仍在各 app 目录（`apps/api/docker-compose.yml`、`apps/admin/docker-compose.yml`），由 [`local/deploy.sh`](local/deploy.sh) 同步到服务器。

**Edge 仅首次在服务器手工部署一份**（例如 `/opt/edge`），详见 [`edge/README.md`](edge/README.md)。从零部署见仓库根 [`CLOUD_DEPLOYMENT.md`](../CLOUD_DEPLOYMENT.md)。
