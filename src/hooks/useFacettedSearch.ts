import { isEqual, pick } from "lodash-es";
import { useContext, useRef, useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { DressipiContext } from "../context/DressipiContext";
import { FacettedSearchResponseFormat } from "../enums/FacettedSearchResponseFormat";
import { AuthenticationError } from "../errors/AuthenticationError";
import { mapFacettedSearchApiResponse } from "../mapping/mapFacettedSearchApiResponse";
import { performFacettedSearch } from "../services/facetted-search";
import { FacetedSearchState, FacettedSearchApiRequest, FacettedSearchApiResponse } from "../types/facetted-search";
import { createQueryParameters } from "../utils/http";

/**
 * Custom hook to perform a facetted search.
 * It will return the state of the facetted search including items, 
 * loading status, and error.
 * 
 * @param request - The request object for the facetted search API.
 * @returns {FacetedSearchState} The state of the facetted search.
 */
export const useFacettedSearch = (request: FacettedSearchApiRequest = {}) => {
  const { 
    credentials, 
    domain, 
    refreshAuthentication 
  } = useContext(DressipiContext);

  const [state, setState] = useState<FacetedSearchState>({
    items: null,
    loading: false,
    error: null
  });

  const requestHasFetched = useRef<FacettedSearchApiRequest | null>(null); // This is to prevent the hook from fetching data when credentials change
  const isRefreshingAuthentication = useRef(false); // This is to prevent the hook from fetching data when credentials change

  useDeepCompareEffect(() => {
    /**
     * If there are no credentials, return early.
     */
    if (!credentials) {
      return;
    }

    /**
     * If the request has not changed, return early.
     * This is to prevent unnecessary API calls.
     */
    if (isEqual(request, requestHasFetched.current)) {
      return;
    }

    /**
     * Function to handle the facetted search.
     * It will perform the facetted search and update the state accordingly.
     */
    const handleFacettedSearch = async () => {
      try {
        /**
         * Create query parameters from the request object.
         * It will only include the response format and pagination parameters.
         */
        const parameters: Record<string, string> = createQueryParameters(
          pick({
            ...request,
            response_format: request.response_format 
              || FacettedSearchResponseFormat.Detailed,
          }, ['response_format', 'per_page', 'page']),
        );

        /**
         * Perform the facetted search.
         */
        const response: FacettedSearchApiResponse = 
          await performFacettedSearch(domain, parameters, request, credentials);

        /**
         * Set the request that has been fetched to the current request.
         */
        requestHasFetched.current = request;

        /**
         * Map the response from the facetted search API to the desired
         * usable format.
         */
        setState({
          items: mapFacettedSearchApiResponse(response),
          loading: false,
          error: null,
        });
      } catch (error) {
        /**
         * If the error is an AuthenticationError, refresh the authentication.
         */
        if (error instanceof AuthenticationError) {
          if (isRefreshingAuthentication.current) {
            return setState({
              items: null,
              loading: false,
              error: new Error(error.message),
            });
          }

          isRefreshingAuthentication.current = true;
          return refreshAuthentication();
        }

        /**
         * If the error is not an AuthenticationError, 
         * set the refreshing authentication flag to false;
         */
        isRefreshingAuthentication.current = false;

        /**
         * Set the state with the error.
         */
        setState({
          items: null,
          loading: false,
          error: (error as Error),
        });
      }
    }

    /**
     * Run the facetted search handler.
     */
    handleFacettedSearch();
  }, [credentials, request])
  
  return state;
}
