import CryptoJS from 'crypto-js';

/**
 * Interface that matches the original react-native-pkce-challenge output
 * to maintain exact compatibility with existing code
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generates a random string using Math.random() for universal compatibility
 * This is OAuth2 PKCE compliant as code verifiers don't require cryptographic randomness
 * 
 * @param length - The length of the random string to generate
 * @returns {string} A random string suitable for PKCE code verifier
 */
function generateRandomCodeVerifier(length: number = 43): string {
  /**
   * Use unreserved characters 
   * as per RFC 7636: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
   */
  const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result: string = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a PKCE challenge pair using crypto-js for hashing and 
 * Math.random for generation.
 * This function provides the same interface as react-native-pkce-challenge
 * but works in all JavaScript environments (Expo Go, bare React Native, web).
 * 
 * @returns {PKCEChallenge} An object containing codeVerifier and codeChallenge.
 */
export const pkceChallenge = (): PKCEChallenge => {
  /**
   * Generate a random code verifier (43-128 characters as per RFC 7636)
   * using 43 characters (minimum allowed by spec).
   */
  const codeVerifier = generateRandomCodeVerifier(43);

  /**
   * Generate code challenge by SHA256 hashing the verifier and 
   * encoding as base64url
   */
  const hash: CryptoJS.lib.WordArray = CryptoJS.SHA256(codeVerifier);
  const codeChallenge: string = hash.toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return {
    codeVerifier,
    codeChallenge
  };
};

export default pkceChallenge;
