import { useCallback, useContext, useMemo, useRef } from 'react';
import { DressipiContext } from '../context/DressipiContext';
import {
  addToBasket as addToBasketEventFunction,
  identify as identifyEventFunction,
  itemClickPdp as itemClickPdpEventFunction,
  itemClickQuickView as itemClickQuickViewEventFunction,
  order as orderEventFunction,
  pageView as pageViewEventFunction,
  productDetailPageView as productDisplayPageViewEventFunction,
  productListPageView as productListPageViewEventFunction,
  removeFromBasket as removeFromBasketEventFunction,
  tabClick as tabClickEventFunction,
} from '../tracking/trackerEvents';
import {
  QueueableEvents,
  QueueableFunction,
  QueuedEvent,
  TrackingState,
} from '../types/tracking';
import { logTrackingEvent } from '../utils/trackingLogging';
import { getNetworkUserId } from '../utils/jwt';

/**
 * Custom hook to access and manage Dressipi tracking events.
 * This hook provides methods to track various events such as
 * orders, adding/removing items from the basket, identifying users,
 * and tracking product display and list page views.
 *
 * @returns {TrackingState} An object containing methods to track
 * different events.
 */
export const useDressipiTracking = (): TrackingState => {
  const { namespaceId, queue, tracker, credentials } =
    useContext(DressipiContext);
  const queueReason =
    credentials && !getNetworkUserId(credentials)
      ? 'missing_network_user_id'
      : 'tracker_not_ready';

  const currentTracking = useRef({ queue, tracker, queueReason });
  currentTracking.current = { queue, tracker, queueReason };

  const trackEvent = useCallback(
    async (eventFunction: QueueableFunction, ...args: any[]) => {
      if (!queue?.current && !tracker) return;

      try {
        const event: QueuedEvent<QueueableEvents> = await eventFunction(
          ...args
        );

        // Event builders are async; route to the tracker/queue active now.
        const { tracker, queue, queueReason } = currentTracking.current;

        if (tracker?.[event.event]) {
          (tracker[event.event] as Function).apply(tracker, event.data);
          logTrackingEvent(event, 'DISPATCHED');
        } else if (queue?.current) {
          queue.current.push(event);
          logTrackingEvent(event, 'QUEUED', queueReason);
        }
      } catch (error) {
        console.error('Error tracking event:', error);
      }
    },
    [queue, tracker]
  );

  return useMemo(
    () => ({
      order: (...args) => trackEvent(orderEventFunction, ...args),
      addToBasket: (...args) => trackEvent(addToBasketEventFunction, ...args),
      removeFromBasket: (...args) =>
        trackEvent(removeFromBasketEventFunction, ...args),
      identify: (...args) =>
        trackEvent(identifyEventFunction(namespaceId), ...args),
      productDisplayPage: (...args) =>
        trackEvent(productDisplayPageViewEventFunction, ...args),
      productListPage: (...args) =>
        trackEvent(productListPageViewEventFunction, ...args),
      tabClick: (...args) => trackEvent(tabClickEventFunction, ...args),
      itemClickQuickView: (...args) =>
        trackEvent(itemClickQuickViewEventFunction, ...args),
      itemClickPdp: (...args) => trackEvent(itemClickPdpEventFunction, ...args),
      pageView: (...args) => trackEvent(pageViewEventFunction, ...args),
    }),
    [namespaceId, trackEvent]
  );
};
