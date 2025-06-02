import { DressipiContext } from "@/src/context/DressipiContext";
import {
  addToBasket as addToBasketEventFunction,
  identify as identifyEventFunction,
  order as orderEventFunction,
  productDetailPageView as productDisplayPageViewEventFunction,
  productListPageView as productListPageViewEventFunction,
  removeFromBasket as removeFromBasketEventFunction,
} from "@/src/tracking/trackerEvents";
import { Queue, QueueableEvents, QueueableFunction, QueuedEvent, Tracking } from "@/src/types/tracking";
import { ReactNativeTracker } from "@snowplow/react-native-tracker";
import { useContext } from "react";

/**
 * Hook to access the Dressipi tracking functions.
 * This hook provides access to the tracking functions
 * for order tracking, basket management, user identification,
 * and product page views.
 */
export const useDressipiTracking = (): Tracking => {
  /**
   * Get the namespace ID, queue, and tracker from the Dressipi context.
   */
  const { namespaceId, queue, tracker } = useContext(DressipiContext);

  /**
   * Returns an object containing the tracking functions.
   * Each function is wrapped in a queueable function that can be used
   * to track events.
   */
  return {
    order: queueable(orderEventFunction, tracker, queue?.current),
    addToBasket: queueable(addToBasketEventFunction, tracker, queue?.current),
    removeFromBasket: queueable(
      removeFromBasketEventFunction, 
      tracker, 
      queue?.current
    ),
    identify: queueable(
      identifyEventFunction(namespaceId), 
      tracker, 
      queue?.current
    ),
    productDisplayPage: queueable(
      productDisplayPageViewEventFunction, 
      tracker, 
      queue?.current
    ),
    productListPage: queueable(
      productListPageViewEventFunction, 
      tracker, 
      queue?.current
    ),
  }
}

/**
 * This function creates a queueable function that can be used to track events.
 * It takes a queued event function, a tracker, and an optional queue as parameters.
 * 
 * The returned function processes the queued events by calling the provided
 * queued event function with the provided arguments.
 * If the queue is set, it pushes the event into the queue.
 * If the tracker is set, it calls the corresponding tracker method
 * with the event data.
 * 
 * @template T - The type of the queued event function.
 * @param {T} queuedEventFunction - The function that generates the queued event.
 * @param {ReactNativeTracker | null} tracker - The tracker instance to use for tracking events.
 * @param {Queue<QueueableEvents> | null} queue - The queue to push the event into.
 * @returns {(...args: Parameters<T>) => void} - A function that processes the queued event.
 */
const queueable = 
  <T extends QueueableFunction>(
    queuedEventFunction: T,
    tracker: ReactNativeTracker | null,
    queue?: Queue<QueueableEvents> | null,
  ): (...args: Parameters<T>) => void => {
    /**
     * Returns a function that processes queued events.
     */
    return (...args: Parameters<T>) => {
      /**
       * This function handles the processing of queued events.
       * It calls the provided queued event function with the
       * provided arguments. 
       * 
       * If the queue is set, it pushes the event into the queue.
       * If the tracker is set, it calls the corresponding tracker method
       * with the event data.
       */
      const handleQueuedEventProcessing = async () => {
        /**
         * Ensure that either the queue or the tracker is set. 
         * If neither is set, throw an error.
         */
        if (!queue || !tracker) {
          throw new Error(
            "Dressipi expected either the queue to be set or the tracker to be set. This is a Dressipi internal error."
          );
        }

        /**
         * Call the queueable event function with the provided arguments.
         * These functions are expected to resolve into a queued event.
         */
        const event: QueuedEvent<QueueableEvents> = 
          await queuedEventFunction(...args);
        
        /**
         * If the queue is set, push the event into the queue.
         * If the tracker is set, call the corresponding tracker method
         * with the event data.
         */
        if (queue) {
          queue.push(event);
        } else if (tracker) {
          (tracker[event.event] as Function).apply(tracker, event.data);
        }
      }

      /**
       * Call the function to handle queued event processing.
       */
      handleQueuedEventProcessing();
    }
}