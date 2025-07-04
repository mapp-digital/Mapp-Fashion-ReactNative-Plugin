import useDeepCompareEffect from 'use-deep-compare-effect';
import { PageViewEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track page view events.
 * This hook uses the Dressipi tracking service to send
 * the page view event to the tracking system.
 *
 * @param {PageViewEventPayload} pageViewPayload - The page view payload.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiPageViewTracking = (
  pageViewPayload: PageViewEventPayload
): void => {
  const { pageView } = useDressipiTracking();

  useDeepCompareEffect(() => {
    pageView(pageViewPayload);
  }, [pageViewPayload, pageView]);
};
