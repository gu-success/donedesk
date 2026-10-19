#!/usr/bin/env bash
# 本地端到端交互测试：xvfb + xfwm4（需要真实窗口管理器来处理最小化/恢复/焦点）
set -e
OUT=${1:-/tmp/dd-e2e}; DATA=$(mktemp -d)
rm -rf "$OUT"
xvfb-run -a -s "-screen 0 1280x800x24" bash -c "(xfwm4 --compositor=off >/dev/null 2>&1 &); sleep 1.5; TN_DATA=$DATA TN_E2E=$OUT timeout 180 npx electron . --no-sandbox"
