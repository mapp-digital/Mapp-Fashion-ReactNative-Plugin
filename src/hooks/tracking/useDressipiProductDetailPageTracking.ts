import useDeepCompareEffect from 'use-deep-compare-effect';
import { TrackingItem } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track product display page views.
 * This hook uses the `useDressipiTracking` hook to
 * send tracking data for a product display page view.
 *
 * @param {TrackingItem} item - The item to track on the product display page.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiProductDisplayPageTracking = (
  item: TrackingItem
): void => {
  const { productDisplayPage } = useDressipiTracking();

  useDeepCompareEffect(() => {
    productDisplayPage(item);
  }, [item, productDisplayPage]);
};
