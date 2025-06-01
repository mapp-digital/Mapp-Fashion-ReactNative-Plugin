/**
 * Type for the authentication credentials for the logged in user, 
 * returned by the Dressipi API.
 */
export type AuthCredentials = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Payload of the bearer token, which is a JSON Web Token (JWT).
 */
export type AccessToken = {
  exp: number
  iat: number
  iss: string
  sub: string
  subn?: string
}

/**
 * Type for the authorization response received from the Dressipi API.
 */
export type AuthorizationResponse = {
  code: string;
  state: string;
}