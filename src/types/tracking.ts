import type {
  EcommerceTransactionProps,
  PageViewProps,
  ReactNativeTracker,
} from '@snowplow/react-native-tracker';

/**
 * Represents the tracking interface for the Dressipi application.
 * This interface defines the methods available for tracking various events
 * such as orders, items added or removed from the basket, user identification,
 * product display pages views, and product list pages views.
 */
export type TrackingState = {
  order: (order: OrderEventPayload) => void;
  addToBasket: (item: AddToBasketEventPayload) => void;
  removeFromBasket: (item: RemoveFromBasketEventPayload) => void;
  identify: (identifiers: IdentifyEventPayload) => void;
  productDisplayPage: (item: ProductDetailPageEventPayload) => void;
  productListPage: (data: ProductListPageEventPayload) => void;
  tabClick: (tabClick: TabClickEventPayload) => void;
  itemClickQuickView: (
    itemClickQuickView: ItemClickQuickViewEventPayload
  ) => void;
  itemClickPdp: (itemClickPdp: ItemClickPdpEventPayload) => void;
  pageView: (pageView: PageViewEventPayload) => void;
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
  | 'trackSelfDescribingEvent'
  | 'trackEcommerceTransactionEvent'
  | 'trackPageViewEvent';

/**
 * Represents a function that can be queued for execution.
 * These functions are the representations of the events
 * that can be tracked by the React Native Tracker.
 *
 * @see trackerEvents.ts for the actual implementations.
 */
export type QueueableFunction = (
  ...args: any[]
) => Promise<QueuedEvent<QueueableEvents>>;

/**
 * Represents a single product used in a tracking event.
 */
export type ProductPayload = {
  /**
   * This is an identifier that is unique to the style and
   * color/pattern of the item.
   */
  product_code: string;
  /**
   * This is an identifier that is unique to the style, color/pattern and size of the item.
   */
  sku: string;
  /**
   * This is an identifier.
   */
  dressipi_item_id?: string;
  /**
   * The name of the item.
   */
  item_name?: string;
  /**
   * The barcode for this variant.
   */
  barcode?: string;
  /**
   * The size of the item/garment being viewed.
   */
  size?: string;
  /**
   * A product affiliation to designate a supplying company or brick and mortar store location.
   */
  affiliation?: string;
  /**
   * The coupon name or code associated with the item.
   */
  coupon?: string;
  /**
   * The currency of the item.
   */
  currency?: string;
  /**
   * The monetary discount value associated with the item.
   */
  discount?: number;
  /**
   * The brand of the item.
   */
  item_brand?: string;
  /**
   * The category of the item.
   */
  item_category?: string;
  /**
   * The second category hierarchy or additional taxonomy for the item.
   */
  item_category2?: string;
  /**
   * The third category hierarchy or additional taxonomy for the item.
   */
  item_category3?: string;
  /**
   * The fourth category hierarchy or additional taxonomy for the item.
   */
  item_category4?: string;
  /**
   * The fifth category hierarchy or additional taxonomy for the item.
   */
  item_category5?: string;
  /**
   * The location associated with the item.
   */
  location_id?: string;
  /**
   * The price of the item.
   */
  price?: number;
  /**
   * The quantity of the item.
   */
  quantity?: number;
};

/**
 * Represents the payload for a product detail page view event.
 */
export type ProductDetailPageEventPayload = ProductPayload;

/**
 * Represents the payload for a product list page view event.
 */
export type ProductListPageEventPayload = {
  /**
   * The page object.
   */
  page?: {
    /**
     * The page number currently visible.
     */
    number?: number;
  };
  /**
   * A list of products.
   */
  items: ProductPayload[];
  /**
   * A list of filters applied to the product list page.
   */
  filters?: ProductListPageFilterItem[];
};

/**
 * A filter object.
 */
export type ProductListPageFilterItem = {
  name: string;
  selected: any[];
};

/**
 * Represents the payload for an add to basket event.
 */
export type AddToBasketEventPayload = {
  /**
   * The SKU of the item.
   */
  sku: string;
  /**
   * The name of the item.
   */
  name?: string;
  /**
   * The category of the item.
   */
  category?: string;
  /**
   * The price of the item.
   */
  unitPrice?: number;
  /**
   * The quantity of the item.
   */
  quantity: number;
  /**
   * The currency of the item.
   */
  currency?: string;
};

/**
 * Represents the payload for a remove from basket event.
 */
export type RemoveFromBasketEventPayload = {
  /**
   * The SKU of the item.
   */
  sku: string;
  /**
   * The name of the item.
   */
  name?: string;
  /**
   * The category of the item.
   */
  category?: string;
  /**
   * The price of the item.
   */
  unitPrice?: number;
  /**
   * The quantity of the item.
   */
  quantity: number;
  /**
   * The currency of the item.
   */
  currency?: string;
};

/**
 * Represents the payload for an order event.
 */
export type OrderEventPayload = EcommerceTransactionProps;

/**
 * Represents the identification information for a user or customer.
 */
export type IdentifyEventPayload = {
  /**
   * The customer ID.
   */
  customerId?: string;
  /**
   * The email address of the user.
   */
  email?: string;
};

/**
 * Represents the payload for a tab click event.
 */
export type TabClickEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The name of the tab that was clicked on.
   */
  tab_name: string;
};

/**
 * Represents the payload for an item click quick view event.
 */
export type ItemClickQuickViewEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The id of the set containing the item that was clicked on,
   * returned in the API request as content_id.
   */
  related_items_set_id?: string;
  /**
   * The id of the item that was clicked on,
   * returned in the request as raw_garment_id.
   */
  dressipi_item_id: number;
};

/**
 * Represents the payload for an item click on a product detail page event.
 */
export type ItemClickPdpEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The id of the set containing the item that was clicked on,
   * returned in the API request as content_id.
   */
  related_items_set_id?: string;
  /**
   * The id of the item that was clicked on,
   * returned in the request as raw_garment_id.
   */
  dressipi_item_id: number;
};

/**
 * Represents the context of the parent event.
 */
export type PageViewEventPayload = PageViewProps;
