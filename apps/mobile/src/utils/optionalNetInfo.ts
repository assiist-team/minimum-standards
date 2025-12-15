/**
 * Helper to lazily require `@react-native-community/netinfo` without making it
 * a hard dependency. This allows the mobile app to render even when the module
 * isn't installed (e.g., trimmed native builds).
 */

type NetInfoModule = typeof import('@react-native-community/netinfo');

let cachedNetInfo: NetInfoModule['default'] | null | undefined;

export function getOptionalNetInfo(): NetInfoModule['default'] | null {
  if (cachedNetInfo !== undefined) {
    return cachedNetInfo;
  }

  try {
    cachedNetInfo = require('@react-native-community/netinfo').default;
  } catch {
    cachedNetInfo = null;
  }

  return cachedNetInfo;
}
