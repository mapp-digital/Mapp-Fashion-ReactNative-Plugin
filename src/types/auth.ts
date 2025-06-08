/**
 * Represents the authentication hook used to manage user authentication state.
 */
export type AuthState = AuthInternalState & {
  refresh: () => Promise<void>;
};

/**
 * Type representing the internal state of authentication hook.
 * It includes properties to track whether the user is authenticating,
 * authenticated, the credentials, network user ID, and 
 * any errors that may occur.
 */
export type AuthInternalState = {
  credentials: AuthCredentials | null;
  networkUserId: string | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: { message: string; code?: string; } | null;
};

/**
 * Type for the authentication credentials for the logged in user, 
 * returned by the Dressipi API.
 */
export type AuthCredentials = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

/**
 * Payload of the bearer token, which is a JSON Web Token (JWT).
 */
export type AccessToken = {
  exp: number
  iat: number
  iss: string
  sub: string
  subn?: string
};

/**
 * Type for the authorization response received from the Dressipi API.
 */
export type AuthorizationResponse = {
  code: string;
  state: string;
};
