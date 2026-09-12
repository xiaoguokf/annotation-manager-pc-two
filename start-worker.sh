#!/usr/bin/env bash
# 前端 worker 容器启动脚本（PC / Admin 通用）：软链记忆 -> 后台启动 codebuddy --serve（Tunnel）。
# 用法：./start-worker.sh <pc|admin>
set -uo pipefail

ROLE="${1:-pc}"
PORT="${2:-8080}"

case "$ROLE" in
  pc|admin) ;;
  *) echo "用法: ./start-worker.sh <pc|admin>"; exit 2 ;;
esac

echo "==> [$ROLE] 软链 CodeBuddy 记忆到本仓库（隔离持久化）"
./memory-link.sh

echo "==> [$ROLE] 启动 codebuddy --serve (port=$PORT, host 0.0.0.0)"
# 同网络下主网关用本容器 IP:PORT 连回；跨网络则需 Tunnel/互通方案（见 CONNECT.md）。
nohup codebuddy --serve --host 0.0.0.0 --port "$PORT" \
  > /tmp/codebuddy-worker-$ROLE.log 2>&1 &
echo "    $ROLE worker pid: $!"

sleep 3
echo "    日志：/tmp/codebuddy-worker-$ROLE.log"
echo "    连接地址：http://<本容器IP>:$PORT  （密码见终端/日志打印）"
echo ""
echo "  把本容器的 IP:PORT 与密码带回【主网关容器】，执行 connect-frontends.sh 完成连接。"
echo "  结束容器前记得：./memory-save.sh"
