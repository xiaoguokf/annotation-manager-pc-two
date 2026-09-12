#!/usr/bin/env bash
# 把本仓库的 CodeBuddy 记忆提交并推送到远端，容器销毁前/定时执行。
# 用法：memory-save.sh
set -euo pipefail

cd "${CODEBUDDY_PROJECT_DIR:-/workspace}"

git add .codebuddy/memory
if git diff --cached --quiet; then
  echo "nothing to save"
  exit 0
fi

git commit -m "chore: save codebuddy memory [$(date -u +%Y-%m-%dT%H:%M:%SZ)]"
git push
echo "memory saved & pushed"
