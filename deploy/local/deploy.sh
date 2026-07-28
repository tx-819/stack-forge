#!/usr/bin/env bash
# 本机构建镜像 → docker save → scp → 服务器 load + compose up。
# 用法（在 monorepo 根目录）：
#   ./deploy/local/deploy.sh api|admin|all
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$SCRIPT_DIR/.env}"

# 默认按国内 ECS 常见的 amd64 构建，避免 Apple Silicon 打出 arm64 导致 exec format error。
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"

usage() {
  echo "Usage: $0 api|admin|all" >&2
  exit 1
}

[[ $# -eq 1 ]] || usage
TARGET="$1"
case "$TARGET" in
  api|admin|all) ;;
  *) usage ;;
esac

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a
fi

: "${SSH_HOST:?SSH_HOST is required (set in deploy/local/.env)}"
: "${SSH_USER:?SSH_USER is required (set in deploy/local/.env)}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required (set in deploy/local/.env)}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY:-}" ]]; then
  # Expand ~ in path
  SSH_KEY="${SSH_KEY/#\~/$HOME}"
  SSH_OPTS+=(-i "$SSH_KEY")
fi

ssh_cmd() {
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "$@"
}

scp_cmd() {
  scp "${SSH_OPTS[@]}" "$@"
}

image_tag() {
  local sha
  sha="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    echo "${sha}-dirty-$(date +%Y%m%d%H%M%S)"
  else
    echo "$sha"
  fi
}

# Upsert KEY=VALUE in remote .env (create file if missing). Does not overwrite other keys.
remote_upsert_env() {
  local remote_dir="$1"
  local key="$2"
  local value="$3"
  ssh_cmd bash -s -- "$remote_dir" "$key" "$value" <<'REMOTE'
set -euo pipefail
remote_dir="$1"
key="$2"
value="$3"
env_path="$remote_dir/.env"
umask 077
mkdir -p "$remote_dir"
touch "$env_path"
tmp="$(mktemp)"
# Drop existing key lines, then append
grep -v -E "^${key}=" "$env_path" >"$tmp" || true
printf '%s=%s\n' "$key" "$value" >>"$tmp"
mv "$tmp" "$env_path"
REMOTE
}

remote_require_edge_network() {
  echo "==> Checking Docker network 'edge' on server"
  if ! ssh_cmd docker network inspect edge >/dev/null 2>&1; then
    echo "error: Docker network 'edge' not found on server." >&2
    echo "Start deploy/edge first (see deploy/edge/README.md), then retry." >&2
    exit 1
  fi
}

# Fail fast if api .env lacks keys required by apps/api/docker-compose.yml
remote_require_api_env() {
  local remote_dir="${DEPLOY_PATH}/api"
  echo "==> Checking required keys in ${remote_dir}/.env"
  ssh_cmd bash -s -- "$remote_dir" <<'REMOTE'
set -euo pipefail
remote_dir="$1"
env_path="$remote_dir/.env"
if [[ ! -f "$env_path" ]]; then
  echo "error: missing ${env_path}" >&2
  echo "Create it on the server first (see apps/api/.env.template / CLOUD_DEPLOYMENT.md)." >&2
  exit 1
fi
required=(
  MYSQL_USER
  MYSQL_PASSWORD
  MYSQL_ROOT_PASSWORD
  MYSQL_DATABASE
  AUTH_ACCESS_TOKEN_SECRET
  APP_FRONTEND_URL
)
missing=()
for key in "${required[@]}"; do
  if ! grep -q -E "^${key}=.+" "$env_path"; then
    missing+=("$key")
  fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "error: ${env_path} is missing or empty: ${missing[*]}" >&2
  echo "Fill these before deploy; this script only upserts DOCKER_IMAGE." >&2
  exit 1
fi
REMOTE
}

deploy_app() {
  local app="$1"
  local tag image remote_dir tmpdir archive remote_archive compose_src service_name

  tag="$(image_tag)"
  image="stack-forge/${app}:${tag}"
  remote_dir="${DEPLOY_PATH}/${app}"
  # macOS mktemp 要求 XXXXXX 在模板末尾，用临时目录存放 .tar.gz
  tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/stack-forge-${app}.XXXXXX")"
  archive="${tmpdir}/image.tar.gz"
  remote_archive="/tmp/stack-forge-${app}-${tag}.tar.gz"
  compose_src="${ROOT_DIR}/apps/${app}/docker-compose.yml"

  case "$app" in
    api) service_name=api ;;
    admin) service_name=web ;;
  esac

  echo "==> Building ${image} (--platform ${DOCKER_PLATFORM})"
  docker build \
    --platform "$DOCKER_PLATFORM" \
    -f "${ROOT_DIR}/apps/${app}/Dockerfile" \
    -t "$image" \
    "$ROOT_DIR"

  echo "==> Saving ${image} -> ${archive}"
  docker save "$image" | gzip >"$archive"

  echo "==> Ensuring remote dir ${remote_dir}"
  ssh_cmd "mkdir -p $(printf '%q' "$remote_dir")"

  echo "==> Uploading image + compose"
  scp_cmd "$archive" "${SSH_USER}@${SSH_HOST}:${remote_archive}"
  scp_cmd "$compose_src" "${SSH_USER}@${SSH_HOST}:${remote_dir}/docker-compose.yml"

  echo "==> Upserting DOCKER_IMAGE on server"
  remote_upsert_env "$remote_dir" DOCKER_IMAGE "$image"

  if [[ "$app" == "admin" ]]; then
    : "${BACKEND_UPSTREAM:?BACKEND_UPSTREAM is required for admin (set in deploy/local/.env)}"
    remote_upsert_env "$remote_dir" BACKEND_UPSTREAM "$BACKEND_UPSTREAM"
  fi

  echo "==> Loading image and starting compose on server"
  ssh_cmd bash -s -- "$remote_archive" "$remote_dir" "$service_name" "$image" <<'REMOTE'
set -euo pipefail
remote_archive="$1"
remote_dir="$2"
service_name="$3"
image="$4"
gunzip -c "$remote_archive" | docker load
rm -f "$remote_archive"
cd "$remote_dir"
if ! docker compose up -d --remove-orphans --wait --wait-timeout 180; then
  docker compose ps
  docker compose logs --tail=200 "$service_name"
  exit 1
fi
docker compose ps
# 只清理悬空层，不用 -a，避免误删同机其他项目未使用的镜像
docker image prune -f --filter "until=168h" >/dev/null || true
# 删除本 app 的旧 tag（保留当前镜像）；image 形如 stack-forge/api:<tag>
repo="${image%:*}"
docker images "$repo" --format '{{.Repository}}:{{.Tag}}' 2>/dev/null \
  | while read -r old; do
      [[ -n "$old" && "$old" != "$image" ]] || continue
      docker rmi "$old" >/dev/null 2>&1 || true
    done
REMOTE

  rm -rf "$tmpdir"
  echo "==> Done: ${app} -> ${image}"
}

remote_require_edge_network
if [[ "$TARGET" == "api" || "$TARGET" == "all" ]]; then
  remote_require_api_env
fi

if [[ "$TARGET" == "all" ]]; then
  deploy_app api
  deploy_app admin
else
  deploy_app "$TARGET"
fi
