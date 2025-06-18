import useDeepCompareEffect from 'use-deep-compare-effect';
import { Order } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track an order being placed.
 * This hook uses the Dressipi tracking service to send
 * the order event to the tracking system.
 *
 * @param {Order} order - The order object containing details about the order.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiOrderTracking = (order: Order): void => {
  const { order: orderEvent } = useDressipiTracking();

  useDeepCompareEffect(() => {
    orderEvent(order);
  }, [order, orderEvent]);
};
