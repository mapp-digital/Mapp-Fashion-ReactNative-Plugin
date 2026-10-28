import CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import {
  identify,
  itemClickPdp,
  itemClickQuickView,
  pageView,
  tabClick,
} from '../../../tracking/trackerEvents';

describe('recommendation page context', () => {
  const id = '44ff586f-ac79-4810-bbac-146f49f02f9c';
  const context = [
    {
      schema: 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0',
      data: { id },
    },
  ];

  it.each([
    {
      build: itemClickPdp,
      name: 'item_click_pdp',
      payload: {
        request_id: 'request',
        related_items_set_id: 'set',
        dressipi_item_id: 123,
      },
    },
    {
      build: itemClickQuickView,
      name: 'item_click_quickview',
      payload: {
        request_id: 'request',
        related_items_set_id: 'set',
        dressipi_item_id: 123,
      },
    },
    {
      build: tabClick,
      name: 'tab_click',
      payload: { request_id: 'request', tab_name: 'Similar Items' },
    },
  ])(
    'attaches the parent as context, outside the $name event data',
    async ({ build, name, payload }) => {
      const create = build as (
        payload: object
      ) => ReturnType<typeof itemClickPdp>;
      const event = {
        schema: `iglu:com.dressipi/${name}/jsonschema/1-0-0`,
        data: payload,
      };
      expect(await create({ ...payload, parentPageViewId: id })).toEqual({
        event: 'trackSelfDescribingEvent',
        data: [event, context],
      });
      expect(await create(payload)).toEqual({
        event: 'trackSelfDescribingEvent',
        data: [event],
      });
      expect(await create({ ...payload, parentPageViewId: '' })).toEqual({
        event: 'trackSelfDescribingEvent',
        data: [event],
      });
    }
  );

  it('uses the same context for the source page and its click', async () => {
    const page = await pageView({ pageUrl: '/products', pageViewId: id });
    const click = await itemClickPdp({
      request_id: 'request',
      dressipi_item_id: 123,
      parentPageViewId: id,
    });
    expect(page).toEqual({
      event: 'trackPageViewEvent',
      data: [{ pageUrl: '/products' }, context],
    });
    expect(click.data[1]).toEqual(page.data[1]);
    expect(await pageView({ pageUrl: '/products' })).toEqual({
      event: 'trackPageViewEvent',
      data: [{ pageUrl: '/products' }],
    });
  });
});

describe('identify event', () => {
  const build = identify('shop');

  it('requires both customerId and email', async () => {
    const error =
      'Dressipi identify event requires both an `email` and a `customerId` to be provided.';
    await expect(build({ customerId: 'customer-1' })).rejects.toThrow(error);
    await expect(build({ email: 'user@example.invalid' })).rejects.toThrow(
      error
    );
  });

  it('sends the customer ID and the hashed email', async () => {
    const event = await build({
      customerId: 'customer-1',
      email: 'user@example.invalid',
    });
    expect(event).toEqual({
      event: 'trackSelfDescribingEvent',
      data: [
        {
          schema: 'iglu:com.dressipi/identify/jsonschema/1-0-0',
          data: {
            identifiers: [
              { name: 'customerId', value: 'customer-1' },
              {
                name: 'email',
                value: CryptoJS.SHA256('user@example.invalid_shop').toString(),
              },
            ],
          },
        },
      ],
    });
  });
});
