import { FacettedSearchApiRequest } from "../types/facetted-search";
import { RelatedItemsApiRequest } from "../types/related-items";

/**
 * Creates a query parameters object from a request object, to be used for the
 * query string of an API request.
 * 
 * @param req - The request object containing the parameters for the 
 * facetted search.
 * @returns {Record<string, string>} An object containing the query parameters 
 * as key-value pairs.
 */
export const createQueryParameters = (
  req: FacettedSearchApiRequest | RelatedItemsApiRequest
): Record<string, string> => {
  /**
   * Loop through the request object and convert each key-value pair 
   * to an key-value object with the string values for the request query.
   */
  return Object.entries(req).reduce((acc, [key, value]) => {
    /**
     * If the key is 'item_id', we skip it.
     */
    if (key === 'item_id') {
      return acc;
    }

    /**
     * Convert the value to a string.
     */
    const valueAsString: string | undefined = convertToString(value);

    /**
     * If the string value is undefined or empty, we skip it.
     */
    if (!valueAsString) {
      return acc;
    }

    switch (key) {
      /**
       * If the key is 'methods', we join the array of methods 
       * into a comma-separated string.
       */
      case 'methods':
        acc[key] = Array.isArray(value) ? value.join(',') : valueAsString;
        break;
      /**
       * If the key is 'response_format', we map the value to 'garment_format'.
       */
      case 'response_format':
        acc['garment_format'] = valueAsString
        break;
      /**
       * For all other keys, we simply assign the string value.
       */
      default:
        acc[key] = valueAsString;
        break;
    }

    return acc;
  }, {} as Record<string, string>)
}

/**
 * Converts a value to a string, handling undefined, null, and boolean values.
 * 
 * @param value - The value to convert.
 * @returns {string | undefined} The string representation of the value, 
 * or undefined if the value is null or undefined.
 */
const convertToString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  /**
   * If the value is a boolean, we convert it to 'true' or 'false'.
   */
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  /**
   * For all other types, we convert the value to a string.
   */
  return String(value);
}
