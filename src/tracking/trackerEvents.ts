import CryptoJS from 'crypto-js';
import { isNil, omitBy } from 'lodash-es';
import {
  AddToBasketEventPayload,
  IdentifyEventPayload,
  ItemClickPdpEventPayload,
  ItemClickQuickViewEventPayload,
  OrderEventPayload,
  PageViewEventPayload,
  ProductDetailPageEventPayload,
  ProductListPageEventPayload,
  QueueableEvents,
  QueuedEvent,
  RemoveFromBasketEventPayload,
  TabClickEventPayload,
} from '../types/tracking';

/**
 * Create a queued event for tracking an order.
 *
 * @param {OrderEventPayload} order - The order details to be tracked.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const order = async (
  order: OrderEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackEcommerceTransactionEvent',
    data: [order],
  };
};

/**
 * Creates a queued event for tracking an "add to basket" action.
 *
 * @param {AddToBasketEventPayload} item - The item added to the basket,
 * containing properties like sku, quantity, etc.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const addToBasket = async (
  item: AddToBasketEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  /**
   * Validates the item object to ensure it contains the required properties
   * for tracking an "add to basket" event.
   */
  if (!item.sku || !item.quantity) {
    throw new Error(
      'Dressipi addToBasket event requires a `sku` and quantity to be provided. This is the style+variant+size identifier and must match the product feed.'
    );
  }

  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema:
          'iglu:com.snowplowanalytics.snowplow/add_to_cart/jsonschema/1-0-0',
        data: item,
      },
    ],
  };
};

/**
 * Creates a queued event for tracking an "remove from basket" action.
 *
 * @param {RemoveFromBasketEventPayload} item - The item removed from
 * the basket.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const removeFromBasket = async (
  item: RemoveFromBasketEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  /**
   * Validates the item object to ensure it contains the required properties
   * for tracking an "remove from basket" event.
   */
  if (!item.sku || !item.quantity) {
    throw new Error(
      'Dressipi removeFromBasket event requires a `sku` and quantity to be provided. This is the style+variant+size identifier and must match the product feed.'
    );
  }

  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema:
          'iglu:com.snowplowanalytics.snowplow/remove_from_cart/jsonschema/1-0-0',
        data: item,
      },
    ],
  };
};

/**
 * Creates a queued event for tracking a product list page view.
 *
 * @param {ProductListPageEventPayload} payload - The product list page event
 * containing page number, items and filters.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const productListPageView = async (
  payload: ProductListPageEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/listings_view/jsonschema/1-0-0',
        data: payload,
      },
    ],
  };
};

/**
 * Creates a queued event for tracking a product detail page view.
 *
 * @param {ProductDetailPageEventPayload} item - The item being viewed
 * on the product detail page.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const productDetailPageView = async (
  item: ProductDetailPageEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/item_view/jsonschema/1-0-0',
        data: omitBy(
          {
            item,
          },
          isNil
        ),
      },
    ],
  };
};

/**
 * Creates a queued event for identifying a user.
 *
 * @param namespaceId - The namespace ID used for hashing the email.
 */
export const identify =
  (namespaceId: string) =>
  async (data: IdentifyEventPayload): Promise<QueuedEvent<QueueableEvents>> => {
    /**
     * If the data object does not contain either an email or customerId,
     * throw an error indicating that at least one of these identifiers
     * is required.
     */
    if (!data || !data.customerId || !data.email) {
      throw new Error(
        'Dressipi identify event requires either an `email` or `customerId` to be provided.'
      );
    }

    /**
     * Create identifiers array by processing each data entry.
     * For emails (containing '@'), hash them with namespaceId.
     * For other values, use them directly.
     */
    const identifiers: Record<string, string>[] = Object.entries(data).map(
      ([key, value]) => {
        if (value.indexOf('@') === -1) {
          /**
           * If the value does not contain an '@', return it as is.
           */
          return { name: key, value };
        }

        /**
         * Hash the email value with the namespaceId to create
         * a unique identifier.
         */
        const hashedValue: string = CryptoJS.SHA256(
          value + '_' + namespaceId
        ).toString();

        return { name: key, value: hashedValue };
      }
    );

    return {
      event: 'trackSelfDescribingEvent',
      data: [
        {
          schema: 'iglu:com.dressipi/identify/jsonschema/1-0-0',
          data: {
            identifiers,
          },
        },
      ],
    };
  };

/**
 * Creates an event for tracking a tab click.
 *
 * @param {TabClickEventPayload} tabClick - Tab click information.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const tabClick = async (
  tabClick: TabClickEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/tab_click/jsonschema/1-0-0',
        data: tabClick,
      },
    ],
  };
};

/**
 * Creates an event for tracking an item click on a quick view.
 *
 * @param {ItemClickQuickViewEventPayload} itemClickQuickView - Item click
 * quick view information.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const itemClickQuickView = async (
  itemClickQuickView: ItemClickQuickViewEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/item_click_quickview/jsonschema/1-0-0',
        data: itemClickQuickView,
      },
    ],
  };
};

/**
 * Creates an event for tracking an item click on a product detail page.
 *
 * @param {ItemClickPdpEventPayload} itemClickPdp - Item click PDP information.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to
 * a queued event object.
 */
export const itemClickPdp = async (
  itemClickPdp: ItemClickPdpEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
        data: itemClickPdp,
      },
    ],
  };
};

export const pageView = async (
  pageView: PageViewEventPayload
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackPageViewEvent',
    data: [pageView],
  };
};
