/**
 * Error thrown for credentials storage issues in the Dressipi API.
 */
export class StorageError extends Error {
  /**
   * Creates an instance of StorageError.
   *
   * @param message - The error message to be displayed.
   */
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}
