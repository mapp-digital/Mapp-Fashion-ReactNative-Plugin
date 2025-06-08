import { isEqual } from "lodash-es";
import { useContext, useRef, useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { DressipiContext } from "../context/DressipiContext";
import { ResponseFormat } from "../enums/ResponseFormat";
import { AuthenticationError } from "../errors/AuthenticationError";
import {
  RelatedItemsGarmentNotFoundError
} from "../errors/RelatedItemsGarmentNotFoundError";
import {
  mapRelatedItemsApiResponse
} from "../mapping/mapRelatedItemsApiResponse";
import { getRelatedItems } from "../services/related-items";
import {
  RelatedItemsApiRequest,
  RelatedItemsApiResponse,
  RelatedItemsState
} from "../types/related-items";
import { createQueryParameters } from "../utils/http";

export const useRelatedItems = (
  request: RelatedItemsApiRequest
): RelatedItemsState => {
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
   * State to hold the items, loading status, and error of the related items
   * feature.
   */
  const [state, setState] = useState<RelatedItemsState>({
    relatedItems: null,
    loading: true,
    error: null,
  });

  /**
   * This ref is used to keep track of the last request that was made.
   */
  const requestHasFetched = useRef<RelatedItemsApiRequest | null>(null);
    
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
     * Function to handle fetching related items.
     * It will perform the request and update the state accordingly.
     */
    const handleRelatedItems = async () => {
      /**
       * If the request does not have an item_id,
       * set the state to an error.
       */
      if (!request.item_id) {
        return setState({
          relatedItems: null,
          loading: false,
          error: new Error(
            "You must pass an item_id to get related items. This is the item + variant (i.e. style + color) identifier for the product."
          ),
        });
      }

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
          ...request,
          response_format: ResponseFormat.Detailed,
        });

        /**
         * Fetch the related items of the item on the request.
         */
        const response: RelatedItemsApiResponse = await getRelatedItems(
          domain, 
          parameters, 
          request.item_id, 
          credentials
        );

        /**
         * Set the request that has been fetched to the current request.
         */
        requestHasFetched.current = request;

        /**
         * Map the response from the facetted search API to the desired
         * usable format.
         */
        setState({
          relatedItems: mapRelatedItemsApiResponse(
            response, 
            ResponseFormat.Detailed
          ),
          loading: false,
          error: null,
        });
      } catch (error) {
        /**
         * If an error occurs, handle it.
         */
        await handleRelatedItemsError(error);
      }
    };

    /**
     * Function to handle errors from fetching the related items.
     * 
     * @param error - The error thrown by the related items API call.
     * @returns {Promise<void>} A promise that resolves when the error 
     * is handled.
     */
    const handleRelatedItemsError = async (
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
           * and the related items request will be performed again.
           */
          await refreshAuthentication();
        } catch (authenticationError) {
          /**
           * If the refresh authentication fails,
           * set the state with the error.
           */
          setState({ 
            relatedItems: null, 
            loading: false, 
            error: authenticationError as Error,
          });
        } finally {
          /**
           * Reset the refreshing authentication flag.
           */
          isRefreshingAuthentication.current = false;
        }
      } else if (error instanceof RelatedItemsGarmentNotFoundError) {
        /**
         * If the error is a RelatedItemsGarmentNotFoundError,
         * it means the item was not found in the related items API,
         * but we don't consider this an error in the 
         * context of the application.
         */
        setState({ 
          relatedItems: null,
          loading: false,
          error: null,
        });
      } else {
        /**
         * If the error is not an AuthenticationError, 
         * set the state with the error.
         */
        setState({ 
          relatedItems: null, 
          loading: false, 
          error: error as Error 
        });
      }
    }

    /**
     * Run the related items handler.
     */
    handleRelatedItems();
  }, [credentials, request, domain, refreshAuthentication]);

  return state;
};