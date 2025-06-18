import { useCallback, useContext, useMemo } from 'react';
import { DressipiContext } from '../context/DressipiContext';
import {
  addToBasket as addToBasketEventFunction,
  identify as identifyEventFunction,
  order as orderEventFunction,
  productDetailPageView as productDisplayPageViewEventFunction,
  productListPageView as productListPageViewEventFunction,
  removeFromBasket as removeFromBasketEventFunction,
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

        Log.info('Tracking event', undefined, {
          event: event.event,
          data: event.data,
        });

        if (queue?.current) {
          queue.current.push(event);
        } else if (tracker?.[event.event]) {
          (tracker[event.event] as Function).apply(tracker, event.data);
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
    }),
    [namespaceId, trackEvent]
  );
};
