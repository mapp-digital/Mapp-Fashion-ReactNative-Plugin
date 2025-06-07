import axios, { AxiosError, AxiosResponse } from "axios";
import { AuthenticationError } from "../errors/AuthenticationError";
import { AuthCredentials } from "../types/auth";
import {
  FacettedSearchApiRequest,
  FacettedSearchApiResponse
} from "../types/facetted-search";

/**
 * Function to perform a facetted search against the Dressipi API.
 * 
 * @param domain - The domain of the Dressipi API.
 * @param parameters - The query parameters to include in the request.
 * @param request - The facetted search request object containing facets 
 * and other parameters.  
 * @param credentials - The authentication credentials to use for the request.
 * @returns {Promise<FacettedSearchApiResponse>} A promise that resolves to 
 * the response from the facetted search API.
 * @throws {AuthenticationError} If the authentication fails (401 or 403).
 * @throws {Error} For other errors that occur during the API call.
 */
export const performFacettedSearch = async (
  domain: string, 
  parameters: Record<string, string>,
  request: FacettedSearchApiRequest,
  credentials: AuthCredentials,
): Promise<FacettedSearchApiResponse> => {
  try {
    /**
     * Convert the parameters to a URLSearchParams object 
     * for the query string.
     */
    const queryString: string = new URLSearchParams(parameters).toString();
    
    /**
     * Make the API call to the facetted search endpoint.
     */
    const response: AxiosResponse<FacettedSearchApiResponse> =
      await axios.post<FacettedSearchApiResponse>(
        `https://${domain}/api/recommendations/facetted?${queryString}`,
        {
          facets: request ? request.facets : [],
        },
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
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
      /**
       * For other errors, throw a generic error with the message 
       * from the AxiosError.
       */
      throw new Error(
        `An error occurred while performing the facetted search: ${axiosError.message}`
      );
    }
  }
}
