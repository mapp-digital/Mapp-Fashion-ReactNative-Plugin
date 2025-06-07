import axios, { AxiosError, AxiosResponse } from "axios";
import { AuthenticationError } from "../errors/AuthenticationError";
import {
  RelatedItemsGarmentNotFoundError
} from "../errors/RelatedItemsGarmentNotFoundError";
import { AuthCredentials } from "../types/auth";
import { RelatedItemsApiResponse } from "../types/related-items";

/**
 * Function to fetch related items from the Dressipi API.
 * 
 * @param domain - The domain of the Dressipi API.
 * @param parameters - The query parameters to include in the request.
 * @param itemId - The ID of the item for which related items are requested.
 * @param credentials - The authentication credentials to use for the request.
 * @returns {Promise<RelatedItemsApiResponse>} A promise that resolves to 
 * the response from the related items API.
 * @throws {AuthenticationError} If the authentication fails (401 or 403).
 * @throws {RelatedItemsGarmentNotFoundError} If the garment is not found in 
 * the related items API.
 * @throws {Error} For other errors that occur during the API call.
 */
export const getRelatedItems = async (
  domain: string,
  parameters: Record<string, string>,
  itemId: string,
  credentials: AuthCredentials
): Promise<RelatedItemsApiResponse> => {
  try {
    /**
     * Convert the parameters to a URLSearchParams object 
     * for the query string.
     */
    const queryString: string = new URLSearchParams(parameters).toString();

    /**
     * Make the API call to the related items endpoint.
     */
    const response: AxiosResponse<RelatedItemsApiResponse> = 
      await axios.get<RelatedItemsApiResponse>(
      `https://${domain}/api/items/${encodeURIComponent(itemId)}/related?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        }
      }
    );

    /**
     * Return the response data from the API call.
     */
    return response.data;
  } catch (error) {
    /**
     * Convert the error to an AxiosError type.
     */
    const axiosError: AxiosError = error as AxiosError;
    
    if (axiosError.status === 401 || axiosError.status === 403) {
      /**
       * If the error is a 401 or 403, throw an AuthenticationError.
       */
      throw new AuthenticationError(
        "Authentication failed. Please check your credentials."
      );
    } else {
      const errorPayload = 
        axiosError.response?.data as { error: { message: string; }; };

      /**
       * If the error payload indicates that the garment was not found,
       * throw a RelatedItemsGarmentNotFoundError.
       */
      if (errorPayload && errorPayload.error.message === 'Garment not found') {
        throw new RelatedItemsGarmentNotFoundError('Garment not found');
      }

      /**
       * For other errors, throw a generic error with the message 
       * from the AxiosError.
       */
      throw new Error(
        `An error occurred while fetching the related items: ${axiosError.message}`
      );
    }
  }
};