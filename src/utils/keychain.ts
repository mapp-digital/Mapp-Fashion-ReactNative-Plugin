/**
 * Generates a username for the Dressipi API based on the client ID.
 *
 * @param clientId - The client ID for the Dressipi API.
 * @return {string} - The generated username.
 */
export const generateUsername = (clientId: string): string =>
  `dressipi-${clientId}`;
