import { useContext, useState } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { DressipiContext } from '../context/DressipiContext';
import { AuthenticationError } from '../errors/AuthenticationError';
import { AuthCredentials } from '../types/auth';
import { useCompliance } from './useCompliance';

/** Shared lifecycle for the two source-free recommendation hooks. */
export const useCuratedItems = <Request extends object, Response>(
  request: Request,
  fetchItems: (
    domain: string,
    request: Request,
    credentials: AuthCredentials | null
  ) => Promise<Response>
): { items: Response | null; loading: boolean; error: Error | null } => {
  const { domain, credentials, refreshAuthentication } =
    useContext(DressipiContext);
  const { hasConsented } = useCompliance();
  const [state, setState] = useState<{
    items: Response | null;
    loading: boolean;
    error: Error | null;
  }>({ items: null, loading: false, error: null });

  useDeepCompareEffect(() => {
    if (hasConsented === null || (hasConsented && !credentials)) {
      setState({ items: null, loading: false, error: null });
      return;
    }
    let active = true;
    setState({ items: null, loading: true, error: null });
    const load = async () => {
      try {
        const items = await fetchItems(
          domain,
          request,
          hasConsented ? credentials : null
        );
        if (active) setState({ items, loading: false, error: null });
      } catch (error) {
        if (!active) return;
        if (error instanceof AuthenticationError && hasConsented) {
          try {
            // A credentials update starts a fresh effect and retries the request.
            await refreshAuthentication();
            // If refresh leaves credentials unchanged, finish with the original
            // error rather than leaving the hook in a permanent loading state.
            if (active) setState({ items: null, loading: false, error });
          } catch (refreshError) {
            if (active)
              setState({
                items: null,
                loading: false,
                error: refreshError as Error,
              });
          }
        } else {
          setState({ items: null, loading: false, error: error as Error });
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [
    domain,
    credentials,
    hasConsented,
    request,
    fetchItems,
    refreshAuthentication,
  ]);

  return state;
};
