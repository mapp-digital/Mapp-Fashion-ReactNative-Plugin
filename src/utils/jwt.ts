import { AccessToken, AuthCredentials } from "../types/auth";

/**
 * Decodes the access token from the provided JWT string.
 * 
 * @param {string} token - The JWT access token to decode.
 * @returns {AccessToken | false} - Returns the decoded access token if valid, otherwise false.
 */
const decodeAccessToken = (token: string): AccessToken | false => {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return false;
    }
  
    return JSON.parse(atob(parts[1])) as AccessToken;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    /**
     * An error occurs during decoding, probably an invalid token format.
     */
    return false;
  }
}

/**
 * Checks if the provided credentials' access token has expired.
 * 
 * @param {AuthCredentials} credentials - The authentication credentials containing the access token.
 * @returns {boolean} - Returns true if the token has expired or is not available, otherwise false.
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
  const decodedAccessToken: AccessToken | false = 
    decodeAccessToken(credentials.access_token);

  /**
   * If the access token could not be decoded, return true
   * indicating that the token has expired or is not valid.
   * Otherwise, check if the expiration time of the access token
   * is less than the current time in seconds.
   * If it is, return true indicating that the token has expired.
   * Otherwise, return false indicating that the token is still valid.
   */
  return decodedAccessToken 
    ? decodedAccessToken.exp < (Date.now() / 1000) 
    : true;
}

/**
 * Retrieves the user ID from the access token in the provided credentials.
 * 
 * @param {AuthCredentials} credentials - The authentication credentials containing the access token.
 * @returns {string | undefined | null} - Returns the user ID if available, otherwise null.
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
  const decodedAccessToken: AccessToken | false = 
    decodeAccessToken(credentials.access_token);

  /**
   * If the access token could not be decoded, return null
   * indicating that the user ID is not available.
   */
  if (!decodedAccessToken) {
    return null;
  }

  /**
   * If the access token could not be decoded, return null
   * indicating that the user ID is not available.
   * Otherwise, return the user ID from the decoded access token.
   */
  return decodedAccessToken.subn || null;
}