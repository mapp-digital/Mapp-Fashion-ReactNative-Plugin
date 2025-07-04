import { useCallback, useContext, useMemo } from 'react';
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
import { Log } from '../utils/logger';

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
  const { namespaceId, queue, tracker } = useContext(DressipiContext);

  const trackEvent = useCallback(
    async (eventFunction: QueueableFunction, ...args: any[]) => {
      if (!queue?.current && !tracker) return;

      try {
        const event: QueuedEvent<QueueableEvents> = await eventFunction(
          ...args
        );

        if (tracker?.[event.event]) {
          Log.info('Sending event to Snowplow:', 'useDressipiTracking.ts', {
            event: event.event,
            name: eventFunction.name,
            data: event.data,
          });

          (tracker[event.event] as Function).apply(tracker, event.data);
        } else if (queue?.current) {
          Log.info('Pushing event to queue:', 'useDressipiTracking.ts', {
            event: event.event,
            name: eventFunction.name,
            data: event.data,
          });

          queue.current.push(event);
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
