import useDeepCompareEffect from 'use-deep-compare-effect';
import { ProductListPageEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track product list page views.
 * This hook uses the `useDressipiTracking` hook to
 * send tracking data for a product list page view.
 *
 * @param {ProductListPageEventPayload} data - The data to track on the
 * product list page.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiProductListPageTracking = (
  data: ProductListPageEventPayload
): void => {
  const { productListPage } = useDressipiTracking();

  useDeepCompareEffect(() => {
    productListPage(data);
  }, [data, productListPage]);
};
