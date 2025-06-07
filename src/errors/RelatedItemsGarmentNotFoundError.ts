/**
 * Error thrown when a related garment item is not found.
 */
export class RelatedItemsGarmentNotFoundError extends Error {
  /**
   * Creates an instance of RelatedItemsGarmentNotFoundError.
   * 
   * @param message - The error message to be displayed.
   */
  constructor(message: string) {
    super(message);
    this.name = "RelatedItemsGarmentNotFoundError";
    Object.setPrototypeOf(this, RelatedItemsGarmentNotFoundError.prototype);
  }
}
