#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
RENEW_SCRIPT="$SCRIPT_DIR/renew-cert.sh"
LOG_FILE="${CRON_LOG:-$HOME/logs/edge-certbot-renew.log}"
SCHEDULE="${CRON_SCHEDULE:-12 3 * * *}"

if [ ! -f "$RENEW_SCRIPT" ]; then
  echo "Missing renew-cert.sh next to this script: $RENEW_SCRIPT" >&2
  exit 1
fi

print_block() {
  echo "SHELL=/bin/bash"
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  echo "$SCHEDULE /bin/sh $RENEW_SCRIPT >>$LOG_FILE 2>&1"
}

case "${1:-}" in
  "")
    echo "# 将下列行加入 crontab（crontab -e），或执行: $0 --install"
    echo ""
    print_block
    echo ""
    echo "可选环境变量：CRON_SCHEDULE（默认 12 3 * * *）、CRON_LOG（默认 \$HOME/logs/edge-certbot-renew.log）"
    ;;
  --install)
    mkdir -p "$(dirname "$LOG_FILE")"
    if crontab -l 2>/dev/null | grep -qF "$RENEW_SCRIPT"; then
      echo "当前 crontab 已包含该脚本路径，跳过写入："
      echo "  $RENEW_SCRIPT"
      echo "如需修改请执行: crontab -e"
      exit 0
    fi
    {
      crontab -l 2>/dev/null || true
      echo ""
      echo "# edge certbot auto-renew (install-auto-renew-cron.sh)"
      print_block
    } | crontab -
    echo "已写入当前用户的 crontab："
    print_block
    echo "日志: $LOG_FILE"
    echo "建议先演练: /bin/sh $RENEW_SCRIPT --dry-run"
    ;;
  *)
    echo "Usage: $0 [--install]" >&2
    echo "  Env: CRON_SCHEDULE  CRON_LOG" >&2
    exit 1
    ;;
esac
