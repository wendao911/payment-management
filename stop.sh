#!/bin/bash

# 支付管理系统一键停止脚本
# 支持 Windows、macOS、Linux

echo "正在停止支付管理系统..."

# 获取脚本所在目录并切换到该目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 停止服务
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose down
else
    docker-compose down
fi

echo "服务已停止"
echo "重新启动: ./payment-management.sh start"
