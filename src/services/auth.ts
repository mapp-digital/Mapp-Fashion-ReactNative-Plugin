import axios, { AxiosResponse } from 'axios';
import uuid from 'react-native-uuid';
import { AuthCredentials, AuthorizationResponse } from '../types/auth';
import { PKCEChallenge, pkceChallenge } from '../utils/pkce';

/**
 * This function handles the authentication process with the Dressipi API.
 * It uses the PKCE (Proof Key for Code Exchange) flow to securely authenticate
 * the user and obtain an access token.
 *
 * @param {string} clientId - The client ID for the Dressipi API.
 * @param {string} domain - The domain of the Dressipi API.
 * @returns {Promise<AuthCredentials>} - A promise that resolves to
 * the authentication credentials.
 */
export const authenticate = async (
  clientId: string,
  domain: string
): Promise<AuthCredentials> => {
  /**
   * Create a PKCE challenge and also an unique state UUID
   * to use in the authentication flow.
   */
  const challenge: PKCEChallenge = pkceChallenge();
  const stateUuid: string = uuid.v4().toString();

  /**
   * Initialize the authorization response variable.
   */
  let authorizationResponse: AuthorizationResponse;

  /**
   * Construct the Query String for the authorization request's URL.
   */
  const authorizationRequestQueryString: string = new URLSearchParams({
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob:auto',
    response_type: 'code',
    client_id: clientId,
    state: stateUuid,
    code_challenge_method: 'S256',
    code_challenge: challenge.codeChallenge,
  }).toString();

  try {
    /**
     * Send the authentication request to the server.
     */
    const response: AxiosResponse<AuthorizationResponse> =
      await axios.get<AuthorizationResponse>(
        `https://${domain}/api/oauth/authorize?${authorizationRequestQueryString}`
      );

    /**
     * If the response is successful, set the authentication response.
     */
    authorizationResponse = response.data;
  } catch (error) {
    /**
     * If there was an error sending the request, throw an error.
     */
    throw new Error(
      `There was an error authenticating with Dressipi: ${(error as Error).message}`
    );
  }

  if (authorizationResponse.state !== stateUuid) {
    /**
     * If the state returned by the server does not match the one we sent,
     * throw an error to prevent CSRF attacks.
     */
    throw new Error('State mismatch in Dressipi authentication');
  }

  /**
   * Initialize the token response variable.
   */
  let tokenResponse: AuthCredentials;

  /**
   * Construct the Query String for the token request's URL.
   */
  const tokenRequestQueryString: string = new URLSearchParams({
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob:auto',
    grant_type: 'authorization_code',
    client_id: clientId,
    code: authorizationResponse.code,
    code_verifier: challenge.codeVerifier,
  }).toString();

  try {
    /**
     * Send the token request to the server.
     */
    const response: AxiosResponse<AuthCredentials> =
      await axios.post<AuthCredentials>(
        `https://${domain}/api/oauth/token?${tokenRequestQueryString}`
      );

    /**
     * If the response is successful, set the token data.
     */
    tokenResponse = response.data;
  } catch (error) {
    /**
     * If there was an error sending the request, throw an error.
     */
    throw new Error(
      `There was an error authenticating with Dressipi: ${(error as Error).message}`
    );
  }

  return tokenResponse;
};

/**
 * Refreshes the authentication token using the refresh token.
 *
 * @param {AuthCredentials} outdatedCredentials - The current authentication
 * credentials.
 * @param {string} clientId - The client ID for the Dressipi API.
 * @param {string} domain - The domain of the Dressipi API.
 * @returns {Promise<AuthCredentials>} - A promise that resolves to the new
 * authentication credentials.
 */
export const refreshToken = async (
  outdatedCredentials: AuthCredentials,
  clientId: string,
  domain: string
): Promise<AuthCredentials> => {
  /**
   * Construct the Query String for the refresh token request's URL.
   */
  const refreshTokenRequestQueryString: string = new URLSearchParams({
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob:auto',
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: outdatedCredentials.refresh_token,
  }).toString();

  try {
    /**
     * Send the refresh token request to the server.
     */
    const response: AxiosResponse<AuthCredentials> =
      await axios.post<AuthCredentials>(
        `https://${domain}/api/oauth/token?${refreshTokenRequestQueryString}`
      );

    /**
     * If the response is successful, return the token data.
     */
    return response.data;
  } catch (error) {
    /**
     * If there was an error sending the request, throw an error.
     */
    throw new Error(
      `There was an error authenticating with Dressipi: ${(error as Error).message}`
    );
  }
};
