#!/usr/bin/env bash
set -euo pipefail

# Installs (clones) and builds whisper.cpp into a local cache dir.
# This repo does NOT vendor whisper.cpp; it is fetched on demand.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CACHE_DIR="${ROOT_DIR}/.cache/whispercpp"
REPO_DIR="${CACHE_DIR}/repo"
MODEL_NAME="${1:-base.en}"

mkdir -p "${CACHE_DIR}"

if [ ! -d "${REPO_DIR}/.git" ]; then
  echo "[whispercpp] Cloning whisper.cpp..."
  git clone --depth 1 https://github.com/ggerganov/whisper.cpp "${REPO_DIR}"
else
  echo "[whispercpp] Updating whisper.cpp..."
  git -C "${REPO_DIR}" pull --ff-only || true
fi

echo "[whispercpp] Building..."
# Prefer CMake when available (newer whisper.cpp). Fallback to Make.
if command -v cmake >/dev/null 2>&1; then
  cmake -S "${REPO_DIR}" -B "${REPO_DIR}/build" \
    -DWHISPER_BUILD_TESTS=OFF \
    -DWHISPER_BUILD_EXAMPLES=ON >/dev/null
  cmake --build "${REPO_DIR}/build" -j >/dev/null
else
  make -C "${REPO_DIR}" -j >/dev/null
fi

# Download model
MODEL_DIR="${REPO_DIR}/models"
if [ -f "${MODEL_DIR}/ggml-${MODEL_NAME}.bin" ]; then
  echo "[whispercpp] Model already present: ggml-${MODEL_NAME}.bin"
else
  echo "[whispercpp] Downloading model: ${MODEL_NAME}"
  bash "${MODEL_DIR}/download-ggml-model.sh" "${MODEL_NAME}"
fi

echo "[whispercpp] Done."

# Print paths for callers
if [ -x "${REPO_DIR}/build/bin/whisper-cli" ]; then
  echo "WHISPERCPP_BIN=${REPO_DIR}/build/bin/whisper-cli"
elif [ -x "${REPO_DIR}/build/bin/main" ]; then
  echo "WHISPERCPP_BIN=${REPO_DIR}/build/bin/main"
elif [ -x "${REPO_DIR}/main" ]; then
  echo "WHISPERCPP_BIN=${REPO_DIR}/main"
else
  echo "[whispercpp] WARNING: couldn't locate built binary" >&2
fi

echo "WHISPERCPP_MODEL=${MODEL_DIR}/ggml-${MODEL_NAME}.bin"
