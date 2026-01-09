#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PACKAGES_DIR="${REPO_ROOT}/packages"
MOBILE_DIR="${REPO_ROOT}/apps/mobile"
DERIVED_DATA_DIR="${HOME}/Library/Developer/Xcode/DerivedData"
BUNDLE_OUTPUT="${MOBILE_DIR}/ios/main.jsbundle"
APP_BUNDLE_ID="com.minimumstandards.mobile"
BUNDLE_GUARD_STRING="${BUNDLE_GUARD_STRING:-firestore is required}"

echo "==> MinimumStandardsMobile nuclear rebuild (repo: ${REPO_ROOT})"

echo ""
echo "1) Rebuilding workspace packages..."
shopt -s nullglob
package_manifests=("${PACKAGES_DIR}"/*/package.json)
if (( ${#package_manifests[@]} == 0 )); then
  echo "   No packages found under ${PACKAGES_DIR}"
else
  for manifest in "${package_manifests[@]}"; do
    pkg_dir="$(dirname "${manifest}")"
    pkg_name="$(basename "${pkg_dir}")"
    has_build="$(node -e "const pkg=require(process.argv[1]); console.log(pkg.scripts && pkg.scripts.build ? 'yes' : '');" "${manifest}")"
    if [[ -n "${has_build}" ]]; then
      echo "   - ${pkg_name}: npm run build"
      (cd "${pkg_dir}" && npm run build)
    else
      echo "   - ${pkg_name}: no build script, skipping"
    fi
  done
fi
shopt -u nullglob

echo ""
echo "2) Refreshing apps/mobile dependencies..."
(cd "${MOBILE_DIR}" && npm install)

echo ""
echo "3) Killing Metro (port 8081) if running..."
if PIDS="$(lsof -ti :8081 2>/dev/null)"; then
  if [[ -n "${PIDS}" ]]; then
    echo "${PIDS}" | xargs kill >/dev/null
    echo "   Terminated process(es): ${PIDS}"
  else
    echo "   No active Metro instances detected."
  fi
else
  echo "   No active Metro instances detected."
fi

echo ""
echo "4) Clearing DerivedData cache..."
derived_pattern="${DERIVED_DATA_DIR}/MinimumStandardsMobile-*"
if compgen -G "${derived_pattern}" >/dev/null; then
  rm -rf ${derived_pattern}
  echo "   Removed DerivedData entries matching MinimumStandardsMobile-*"
else
  echo "   No DerivedData entries to remove."
fi

echo ""
echo "5) Uninstalling app from booted simulators (optional)..."
if command -v xcrun >/dev/null 2>&1; then
  booted_devices="$(xcrun simctl list devices booted 2>/dev/null || true)"
  if grep -q "Booted" <<<"${booted_devices}"; then
    if xcrun simctl uninstall booted "${APP_BUNDLE_ID}" >/dev/null 2>&1; then
      echo "   Removed ${APP_BUNDLE_ID} from the booted simulator."
    else
      echo "   Failed to uninstall from the booted simulator (continuing)."
    fi
  else
    echo "   No booted simulators detected; skipping uninstall."
  fi
else
  echo "   xcrun not found; skipping simulator uninstall."
fi

echo ""
echo "6) Regenerating the embedded bundle..."
(cd "${MOBILE_DIR}" && npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios \
  --reset-cache)

echo ""
echo "7) Verifying guard string \"${BUNDLE_GUARD_STRING}\"..."
if grep -Fn "${BUNDLE_GUARD_STRING}" "${BUNDLE_OUTPUT}" >/dev/null; then
  echo "   [OK] Guard string located in ${BUNDLE_OUTPUT}"
else
  echo "   [FAIL] Guard string not found in ${BUNDLE_OUTPUT}"
  exit 1
fi

cat <<'EOF'

Next steps:
  - Open Xcode and select the "MinimumStandardsMobile (Embedded)" scheme, or run:
      FORCE_EMBEDDED_JS_BUNDLE=1 SKIP_BUNDLING=0 \
        npx react-native run-ios \
        --scheme "MinimumStandardsMobile (Embedded)" \
        --device "Ben's iPhone"
    (Drop the --device flag to target the booted simulator.)
  - Perform a Clean Build Folder, then build + run to exercise the embedded bundle.
EOF
