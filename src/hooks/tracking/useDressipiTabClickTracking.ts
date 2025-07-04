import useDeepCompareEffect from 'use-deep-compare-effect';
import { TabClickEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track tab click events.
 * This hook uses the Dressipi tracking service to send
 * the tab click event to the tracking system.
 *
 * @param {TabClickEventPayload} tabClickPayload - The tab click payload.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiTabClickTracking = (
  tabClickPayload: TabClickEventPayload
): void => {
  const { tabClick } = useDressipiTracking();

  useDeepCompareEffect(() => {
    tabClick(tabClickPayload);
  }, [tabClickPayload, tabClick]);
};
