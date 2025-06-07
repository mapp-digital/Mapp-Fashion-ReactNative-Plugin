/**
 * Error thrown for authentication issues in the Dressipi API.
 */
export class AuthenticationError extends Error {
  /**
   * Creates an instance of AuthenticationError.
   * 
   * @param message - The error message to be displayed.
   */
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
