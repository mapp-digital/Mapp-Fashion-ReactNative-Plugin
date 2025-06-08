import { isEqual } from "lodash-es";
import { useContext, useRef, useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { DressipiContext } from "../context/DressipiContext";
import { ResponseFormat } from "../enums/ResponseFormat";
import { AuthenticationError } from "../errors/AuthenticationError";
import { mapFacettedSearchApiResponse } from "../mapping/mapFacettedSearchApiResponse";
import { performFacettedSearch } from "../services/facetted-search";
import {
  FacettedSearchApiRequest,
  FacettedSearchApiResponse,
  FacettedSearchState
} from "../types/facetted-search";
import { createQueryParameters } from "../utils/http";

/**
 * Custom hook to perform a facetted search.
 * It will return the state of the facetted search including items, 
 * loading status, and error.
 * 
 * @param request - The request object for the facetted search API.
 * @returns {FacettedSearchState} The state of the facetted search.
 */
export const useFacettedSearch = (
  request: FacettedSearchApiRequest = {}
): FacettedSearchState => {
  /**
   * Get the credentials, domain, and refreshAuthentication function
   * from the DressipiContext.
   */
  const { 
    credentials, 
    domain, 
    refreshAuthentication 
  } = useContext(DressipiContext);

  /**
   * State to hold the items, loading status, and error of the facetted search.
   */
  const [state, setState] = useState<FacettedSearchState>({
    items: null,
    loading: false,
    error: null
  });

  /**
   * This ref is used to keep track of the last request that was made.
   */
  const requestHasFetched = useRef<FacettedSearchApiRequest | null>(null);
  
  /**
   * This ref is used to keep track of whether the authentication 
   * is being refreshed.
   */
  const isRefreshingAuthentication = useRef(false);

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
     * While the authentication is being refreshed,
     * do not perform the facetted search.
     * This is to prevent multiple requests being sent
     * while the authentication is being refreshed.
     */
    if (isRefreshingAuthentication.current) {
      return;
    }

    /**
     * Function to handle the facetted search.
     * It will perform the facetted search and update the state accordingly.
     */
    const handleFacettedSearch = async () => {
      /**
       * Set the loading state to true.
       */
      setState(previous => ({ ...previous, loading: true, error: null }));

      try {
        /**
         * Create query parameters from the request object.
         * It will only include the response format and pagination parameters.
         */
        const parameters: Record<string, string> = createQueryParameters({
          response_format: 
            request.response_format || ResponseFormat.Detailed,
          per_page: request.per_page,
          page: request.page,
        });

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
         * If an error occurs, handle it.
         */
        await handleFacettedSearchError(error);
      }
    }

    /**
     * Function to handle errors from the facetted search.
     * 
     * @param error - The error thrown by the facetted search.
     */
    const handleFacettedSearchError = async (
      error: unknown
    ): Promise<void> => {
      /**
       * If the error is an instance of AuthenticationError,
       * and we are not currently refreshing the authentication,
       * attempt to refresh the authentication.
       */
      if (
        error instanceof AuthenticationError 
        && !isRefreshingAuthentication.current
      ) {
        /**
         * Set the refreshing authentication flag to true.
         */
        isRefreshingAuthentication.current = true;

        try {
          /**
           * Attempt to refresh the authentication.
           * If it succeeds, the useEffect will re-run
           * and the facetted search will be performed again.
           */
          await refreshAuthentication();
        } catch (authenticationError) {
          /**
           * If the refresh authentication fails,
           * set the state with the error.
           */
          setState({ 
            items: null, 
            loading: false, 
            error: authenticationError as Error,
          });
        } finally {
          /**
           * Reset the refreshing authentication flag.
           */
          isRefreshingAuthentication.current = false;
        }
      } else {
        /**
         * If the error is not an AuthenticationError, 
         * set the state with the error.
         */
        setState({ 
          items: null, 
          loading: false, 
          error: error as Error,
        });
      }
    }

    /**
     * Run the facetted search handler.
     */
    handleFacettedSearch();
  }, [credentials, request, domain, refreshAuthentication]);
  
  return state;
}
