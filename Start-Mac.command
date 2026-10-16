#!/bin/bash
set -e
cd "$(dirname "$0")"
trap 'echo "启动失败，请查看上方信息，按回车关闭。"; read -r' ERR
case "$(uname -m)" in arm64) arch=arm64;; x86_64) arch=x64;; *) echo '暂不支持此 CPU'; exit 1;; esac
name="node-v22.22.2-darwin-$arch"
archive="runtime/$name.tar.gz"
if [ ! -x "runtime/$name/bin/node" ]; then
  echo '首次启动：正在校验并解压内置 Node.js…'
  (cd runtime && /usr/bin/shasum -a 256 -c "$name.sha256")
  tar -xzf "$archive" -C runtime
fi
"runtime/$name/bin/node" start.cjs
