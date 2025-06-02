import type {
  EcommerceItem,
  ReactNativeTracker
} from '@snowplow/react-native-tracker';

/**
 * Represents the tracking interface for the Dressipi application.
 * This interface defines the methods available for tracking various events
 * such as orders, items added or removed from the basket, user identification,
 * product display pages views, and product list pages views.
 */
export type Tracking = {
  order: (order: Order) => void;
  addToBasket: (item: TrackingItem) => void;
  removeFromBasket: (item: TrackingItem) => void;
  identify: (identifiers: Identification) => void;
  productDisplayPage: (item: TrackingItem) => void;
  productListPage: (data: ProductListPageEvent) => void;
};

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
};

/**
 * Represents the events that can be queued for tracking 
 * in the React Native Tracker.
 */
export type QueueableEvents = 
  'trackSelfDescribingEvent' | 'trackEcommerceTransactionEvent';

/**
 * Represents a function that can be queued for execution.
 * These functions are the representations of the events
 * that can be tracked by the React Native Tracker.
 * 
 * @see trackerEvents.ts for the actual implementations.
 */
export type QueueableFunction = 
  (...args: any[]) => Promise<QueuedEvent<QueueableEvents>>;

/**
 * Represents an order in an e-commerce context.
 */
export type Order = {
  orderId: string;
  totalValue: number;
  items: OrderLine[];
  affiliation?: string;
  taxValue?: number;
  shipping?: number;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;
};

/**
 * Represents an item in an order, including its details.
 */
export type OrderLine = EcommerceItem;

/**
 * Represents an item in a tracking event, such as an item
 * in a shopping cart or an order.
 */
export type TrackingItem = {
  barcode?: string;
  brand?: string;
  category?: string;
  currency?: string;
  listPrice?: string;
  name?: string;
  price?: string;
  position?: number;
  productCode?: string;
  quantity?: number;
  size?: string;
  sku?: string;
};

/**
 * Represents a product list page event, which includes information
 * about the current page, items displayed, and any filters applied.
 */
export type ProductListPageEvent = {
  page: {
    number: number;
  };
  items: ProductListPageItem[];
  filters: ProductListPageFilter[];
};

/**
 * Represents an item in a product list page, which can be identified
 * by its SKU or product code.
 */
export type ProductListPageItem = {
  sku?: string
  productCode?: string
};

/**
 * Represents a filter applied on a product list page.
 */
export type ProductListPageFilter = {
  selected: any[];
  name: string;
};

/**
 * Represents the identification information for a user or customer.
 */
export type Identification = {
  customerId?: string
  email?: string
};
