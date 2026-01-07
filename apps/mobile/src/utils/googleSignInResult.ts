type AnyObject = Record<string, unknown>;

export interface NormalizedGoogleSignInData {
  idToken: string | null | undefined;
  accessToken: string | null | undefined;
  user?: AnyObject;
}

export interface NormalizedGoogleSignInResult {
  success: boolean;
  data?: NormalizedGoogleSignInData;
}

function extractPayload(source: unknown): NormalizedGoogleSignInData | undefined {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const candidate = source as AnyObject;
  const data =
    candidate.data && typeof candidate.data === 'object'
      ? (candidate.data as AnyObject)
      : candidate;

  if (!data || typeof data !== 'object') {
    return undefined;
  }

  return {
    idToken: (data as AnyObject).idToken as string | null | undefined,
    accessToken: (data as AnyObject).accessToken as string | null | undefined,
    user: (data as AnyObject).user as AnyObject | undefined,
  };
}

/**
 * Normalizes Google Sign-In results to a consistent shape. Handles both
 * Expo-like { type: 'success', data: {...} } responses as well as the
 * @react-native-google-signin/google-signin User object.
 */
export function normalizeGoogleSignInResult(result: unknown): NormalizedGoogleSignInResult {
  if (!result || typeof result !== 'object') {
    return { success: false };
  }

  const candidate = result as AnyObject;
  if ('type' in candidate && candidate.type !== 'success') {
    return { success: false };
  }

  return {
    success: true,
    data: extractPayload(result),
  };
}
