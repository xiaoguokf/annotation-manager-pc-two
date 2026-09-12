#!/usr/bin/env bash
# 把 CodeBuddy 记忆软链进本仓库，使其随 git 持久化、按仓库隔离。
# 用法：容器启动时执行一次（可放进 cnb 启动命令 / lifecycle）。
set -euo pipefail

NS_DIR="/root/.codebuddy/projects/workspace/memory"   # CodeBuddy 固定记忆路径（namespace=workspace）
REPO_MEM="${CODEBUDDY_PROJECT_DIR:-/workspace}/.codebuddy/memory"

mkdir -p "$REPO_MEM"

# 首次运行：把已有真实记忆文件迁移进仓库，再替换为软链
if [ -d "$NS_DIR" ] && [ ! -L "$NS_DIR" ]; then
  cp -n "$NS_DIR"/*.md "$REPO_MEM"/ 2>/dev/null || true
  rm -rf "$NS_DIR"
fi

ln -sfn "$REPO_MEM" "$NS_DIR"
echo "memory linked: $NS_DIR -> $REPO_MEM"
