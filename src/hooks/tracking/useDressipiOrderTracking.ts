import useDeepCompareEffect from 'use-deep-compare-effect';
import { OrderEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track an order being placed.
 * This hook uses the Dressipi tracking service to send
 * the order event to the tracking system.
 *
 * @param {OrderEventPayload} order - The order object containing details about the order.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiOrderTracking = (order: OrderEventPayload): void => {
  const { order: orderEvent } = useDressipiTracking();

  useDeepCompareEffect(() => {
    orderEvent(order);
  }, [order, orderEvent]);
};
