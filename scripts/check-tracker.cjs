// Exercise the installed Snowplow serializer/emitter. Native platform/storage and
// the collector response are simulated; this does not establish native/backend parity.
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
process.env.EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE = 'dressipi';
const fromPackage = Module.createRequire(path.join(root, 'package.json'));
const values = new Map();
const appStateListeners = new Set();
const storage = {
  getItem: async key => values.get(key) ?? null,
  setItem: async (key, value) => {
    values.set(key, value);
  },
  multiRemove: async keys => {
    keys.forEach(key => values.delete(key));
  },
};
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'react-native-get-random-values') return {};
  if (name === 'react-native')
    return {
      Platform: {
        OS: 'android',
        constants: { Release: '16', Model: 'Synthetic', Manufacturer: 'Test' },
      },
      NativeModules: { I18nManager: { localeIdentifier: 'en_GB' } },
      Dimensions: { get: () => ({ width: 400, height: 800 }) },
      PixelRatio: { get: () => 2 },
      AppState: {
        currentState: 'active',
        addEventListener: (_event, listener) => {
          appStateListeners.add(listener);
          return { remove: () => appStateListeners.delete(listener) };
        },
      },
    };
  return load.call(this, name, ...args);
};

const requests = [];
global.fetch = async request => {
  requests.push({
    url: request.url,
    method: request.method,
    body: JSON.parse(await request.text()),
  });
  return new Response('', { status: 200 });
};

async function main() {
  const { createTracker } = fromPackage('./dist/tracking/tracker.js');
  const events = fromPackage('./dist/tracking/trackerEvents.js');
  const { getTracker } = fromPackage('@snowplow/react-native-tracker');
  const controller = new AbortController();
  try {
    const tracker = await createTracker(
      'synthetic-shop',
      'collector.example',
      'synthetic-user',
      controller.signal,
      { appVersion: '1.0.0', appBuild: '1' }
    );
    assert.ok(tracker, 'tracker initialization');
    const product = { sku: 'sku-1', product_code: 'product-1' };
    const scenarios = [
      [
        events.addToBasket,
        { sku: 'sku-1', quantity: 1 },
        'iglu:com.snowplowanalytics.snowplow/add_to_cart/jsonschema/1-0-0',
      ],
      [
        events.removeFromBasket,
        { sku: 'sku-1', quantity: 1 },
        'iglu:com.snowplowanalytics.snowplow/remove_from_cart/jsonschema/1-0-0',
      ],
      [
        events.productListPageView,
        { items: [product] },
        'iglu:com.dressipi/listings_view/jsonschema/1-0-0',
      ],
      [
        events.productDetailPageView,
        product,
        'iglu:com.dressipi/item_view/jsonschema/1-0-0',
      ],
      [
        events.identify('synthetic-shop'),
        { customerId: 'customer-1', email: 'synthetic@example.invalid' },
        'iglu:com.dressipi/identify/jsonschema/1-0-0',
      ],
      [
        events.tabClick,
        { request_id: 'request-1', tab_name: 'Outfits' },
        'iglu:com.dressipi/tab_click/jsonschema/1-0-0',
      ],
      [
        events.itemClickQuickView,
        { request_id: 'request-1', dressipi_item_id: 1 },
        'iglu:com.dressipi/item_click_quickview/jsonschema/1-0-0',
      ],
      [
        events.itemClickPdp,
        { request_id: 'request-1', dressipi_item_id: 1 },
        'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
      ],
    ];
    const expected = [];
    for (const [build, input, schema] of scenarios) {
      const event = await build(input);
      assert.equal(event.data[0].schema, schema);
      expected.push(event.data[0]);
      tracker[event.event](...event.data);
    }
    tracker.trackPageViewEvent({
      pageUrl: '/products',
      pageTitle: 'Products',
      referrer: '/home',
    });
    tracker.trackEcommerceTransactionEvent({
      orderId: 'order-1',
      totalValue: 20,
      taxValue: 2,
      items: [{ sku: 'sku-1', price: 10, quantity: 2 }],
    });
    // Wait for the install plugin's timer before flushing its event too.
    await new Promise(resolve => setTimeout(resolve, 20));
    for (const listener of appStateListeners) await listener('background');
    for (const listener of appStateListeners) await listener('active');
    await getTracker('dressipi').flush();
    assert.ok(requests.length > 0);
    for (const request of requests) {
      assert.equal(request.url, 'https://collector.example/t/t');
      assert.equal(request.method, 'POST');
      assert.equal(
        request.body.schema,
        'iglu:com.snowplowanalytics.snowplow/payload_data/jsonschema/1-0-4'
      );
    }
    const payloads = requests.flatMap(request => request.body.data);
    for (const payload of payloads) {
      assert.equal(payload.aid, 'synthetic-shop');
      assert.equal(payload.nuid, 'synthetic-user');
      assert.equal(payload.tna, 'dressipi');
      assert.equal(payload.tv, 'rn-4.10.2');
      assert.match(payload.eid, /^[0-9a-f-]{36}$/i);
      const contexts = JSON.parse(
        Buffer.from(payload.cx, 'base64').toString()
      ).data;
      assert.ok(
        contexts.some(
          context =>
            context.schema ===
              'iglu:com.snowplowanalytics.mobile/application/jsonschema/1-0-0' &&
            context.data.version === '1.0.0'
        )
      );
    }
    const custom = payloads
      .filter(payload => payload.ue_px)
      .map(
        payload =>
          JSON.parse(Buffer.from(payload.ue_px, 'base64').toString()).data
      );
    for (const event of expected) {
      assert.deepEqual(
        custom.filter(actual => actual.schema === event.schema),
        [event]
      );
    }
    assert.equal(
      payloads.length,
      expected.length + 6,
      '8 custom + page + item + transaction + install + background + foreground'
    );
    const page = payloads.find(payload => payload.e === 'pv');
    assert.equal(page.url, '/products');
    assert.equal(page.refr, '/home');
    assert.equal(payloads.find(payload => payload.e === 'tr').tr_tt, '20');
    assert.equal(payloads.find(payload => payload.e === 'ti').ti_id, 'order-1');
    assert.equal(
      custom.filter(
        event =>
          event.schema ===
          'iglu:com.snowplowanalytics.snowplow/application_background/jsonschema/1-0-0'
      ).length,
      1
    );
    assert.equal(
      custom.filter(
        event =>
          event.schema ===
          'iglu:com.snowplowanalytics.snowplow/application_foreground/jsonschema/1-0-0'
      ).length,
      1
    );
    controller.abort();
    assert.equal(appStateListeners.size, 0, 'lifecycle listeners removed');
    const count = requests.length;
    tracker.trackPageViewEvent({ pageUrl: '/after-withdrawal' });
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(requests.length, count);
    assert.equal(values.size, 0, 'Fashion storage cleared');
    console.log(
      `PASS: ${payloads.length} real Snowplow payloads; all Fashion event builders, routing, identity, encoding and withdrawal checked (simulated platform/collector).`
    );
  } finally {
    controller.abort();
    Module._load = load;
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
