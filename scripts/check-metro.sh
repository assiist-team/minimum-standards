#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> React Native Metro health check (repo: ${REPO_ROOT})"
issues=()

echo ""
echo "1) Checking Node runtime..."
if ! command -v node >/dev/null 2>&1; then
  issues+=("Node.js not found on PATH. Install Node >=20 and retry.")
else
  NODE_BIN="$(command -v node)"
  NODE_VERSION="$(node -p "process.versions.node")"
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  echo "   [OK] Found Node at ${NODE_BIN} (v${NODE_VERSION})"
  if (( NODE_MAJOR < 20 )); then
    issues+=("Node ${NODE_VERSION} detected. Please switch to Node >=20 (see package.json engines field).")
  fi
fi

echo ""
echo "2) Checking Watchman..."
if ! command -v watchman >/dev/null 2>&1; then
  issues+=("Watchman not installed. Install via 'brew install watchman' to keep Metro file watching stable.")
else
  WATCHMAN_OUTPUT="$(watchman watch-list 2>/dev/null || true)"
  if grep -q "\"${REPO_ROOT}\"" <<<"${WATCHMAN_OUTPUT}"; then
    echo "   [OK] Watchman already watching ${REPO_ROOT}"
  else
    echo "   [WARN] Watchman is not watching ${REPO_ROOT}"
    issues+=("Run 'watchman watch \"${REPO_ROOT}\"' so Metro receives file change events.")
  fi
fi

echo ""
echo "3) Checking Metro port (8081)..."
if PORT_PIDS="$(lsof -ti :8081 2>/dev/null)"; then
  echo "   [WARN] Port 8081 is already in use by:"
  lsof -i :8081 -sTCP:LISTEN || true
  issues+=("Port 8081 busy. Kill the listed process or run 'lsof -ti :8081 | xargs kill'.")
else
  echo "   [OK] Port 8081 is free."
fi

echo ""
if (( ${#issues[@]} == 0 )); then
  echo "[PASS] Metro preflight looks good. Run 'npm run dev:ios' from apps/mobile to launch Fast Refresh."
else
  echo "[FAIL] Found ${#issues[@]} issue(s):"
  for issue in "${issues[@]}"; do
    echo "   - ${issue}"
  done
  exit 1
fi
