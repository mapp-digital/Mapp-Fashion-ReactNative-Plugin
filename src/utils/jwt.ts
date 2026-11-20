import { AccessToken, AuthCredentials } from '../types/auth';

const hasIdentity = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Decodes the access token from the provided JWT string.
 *
 * @param {string} token - The JWT access token to decode.
 * @returns {AccessToken | false} - Returns the decoded access token if valid,
 * otherwise false.
 */
const decodeAccessToken = (token: string): AccessToken | false => {
  try {
    const parts: string[] = token.split('.');

    if (parts.length !== 3) {
      return false;
    }

    return JSON.parse(atob(parts[1])) as AccessToken;
  } catch {
    /**
     * An error occurs during decoding, probably an invalid token format.
     */
    return false;
  }
};

/**
 * Checks if the provided credentials' access token has expired.
 *
 * @param {AuthCredentials} credentials - The authentication credentials
 * containing the access token.
 * @returns {boolean} - Returns true if the token has expired or
 * is not available, otherwise false.
 */
export const accessTokenHasExpired = (
  credentials: AuthCredentials
): boolean => {
  /**
   * Check if the credentials or its access token are provided.
   * If not, return true indicating that the token has expired
   * or is not available.
   */
  if (!credentials || !credentials.access_token) {
    return true;
  }

  /**
   * Extract the access token from the credentials.
   */
  const decodedAccessToken: AccessToken | false = decodeAccessToken(
    credentials.access_token
  );

  /**
   * If the access token could not be decoded, return true
   * indicating that the token has expired or is not valid.
   * Otherwise, check if the expiration time of the access token
   * is less than the current time in seconds.
   * If it is, return true indicating that the token has expired.
   * Otherwise, return false indicating that the token is still valid.
   */
  return decodedAccessToken ? decodedAccessToken.exp < Date.now() / 1000 : true;
};

/**
 * Retrieves the server-issued tracking ID from the token or from an earlier
 * token for the same profile. OAuth sub is only used to check the profile;
 * it is never used as the tracking ID.
 *
 * @param {AuthCredentials} credentials - The authentication credentials
 * containing the access token.
 * @returns {string | null} - Returns the user ID if available,
 * otherwise null.
 */
export const getNetworkUserId = (
  credentials: AuthCredentials
): string | null => {
  /**
   * Check if the credentials or its access token are provided.
   * If not, return null indicating that the user ID is not available.
   */
  if (!credentials || !credentials.access_token) {
    return null;
  }

  /**
   * Extract the access token from the credentials.
   */
  const decodedAccessToken: AccessToken | false = decodeAccessToken(
    credentials.access_token
  );

  /**
   * If the access token could not be decoded, return null
   * indicating that the user ID is not available.
   */
  if (!decodedAccessToken) {
    return null;
  }

  /**
   * Return the user ID from the decoded access token.
   */
  if (hasIdentity(decodedAccessToken.subn)) return decodedAccessToken.subn;

  const saved = credentials.trackingIdentity;
  return hasIdentity(decodedAccessToken.sub) &&
    saved?.profileId === decodedAccessToken.sub &&
    hasIdentity(saved.networkUserId)
    ? saved.networkUserId
    : null;
};

/**
 * Refresh responses can omit subn. Retain the server-issued ID with the new
 * credentials only when both tokens identify the same profile. This local
 * metadata is persisted by the storage adapter; the JWT is never modified.
 */
export const retainTrackingIdentity = (
  credentials: AuthCredentials,
  previousCredentials?: AuthCredentials
): AuthCredentials => {
  const result = { ...credentials };
  // Identity metadata is created here, never accepted from an OAuth response.
  delete result.trackingIdentity;
  const current = decodeAccessToken(result.access_token);
  if (!current || !hasIdentity(current.sub)) return result;

  const previous = previousCredentials
    ? decodeAccessToken(previousCredentials.access_token)
    : false;
  const networkUserId =
    getNetworkUserId(result) ??
    (previousCredentials && previous && previous.sub === current.sub
      ? getNetworkUserId(previousCredentials)
      : null);
  if (networkUserId) {
    result.trackingIdentity = { profileId: current.sub, networkUserId };
  }
  return result;
};
