import type { ReactNativeTracker } from '@snowplow/react-native-tracker';

/**
 * Represents a queue (list) of events for the React Native Tracker 
 * from Snowplow.
 */
export type Queue<T extends keyof ReactNativeTracker> = QueuedEvent<T>[];

/**
 * Represents a queued event for the React Native Tracker from Snowplow.
 * This type is used to define the structure of events that can be queued
 * before being sent to the tracker.
 * 
 * @property {T} event - The name of the event to be tracked.
 * @property {Parameters<ReactNativeTracker[T]>} data - The parameters 
 * for the event, which are the arguments expected by the 
 * tracker method for that event.
 */
export type QueuedEvent<T extends keyof ReactNativeTracker> = {
  event: T;
  data: Parameters<ReactNativeTracker[T]>;
}

/**
 * Represents the events that can be queued for tracking 
 * in the React Native Tracker.
 */
export type QueueableEvents = 
  'trackSelfDescribingEvent' | 'trackEcommerceTransactionEvent'