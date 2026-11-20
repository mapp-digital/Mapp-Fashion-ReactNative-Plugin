import axios from 'axios';
import {
  buildPageView,
  buildSelfDescribingEvent,
  trackerCore,
} from '@snowplow/tracker-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithLogging,
  httpGet,
  httpPost,
} from '../../../utils/httpLogging';
import { Log } from '../../../utils/logger';
import { productDetailPageView } from '../../../tracking/trackerEvents';
import { logTrackingEvent } from '../../../utils/trackingLogging';

const entries = () =>
  vi
    .mocked(console.info)
    .mock.calls.filter(([message]) =>
      String(message).includes('[Fashion HTTP]')
    )
    .map(([message, data]) => ({
      phase: String(message).split(' ').at(-1),
      ...JSON.parse(String(data)),
    }));

beforeEach(() => {
  vi.clearAllMocks();
  Log.init(true);
});
afterEach(() => {
  Log.init(false);
  vi.unstubAllGlobals();
});

describe('Fashion API request logs', () => {
  it('pairs URL, JSON body, status and response without changing the request', async () => {
    const url = 'https://fashion.example/api/recommendations/facetted?page=2';
    const body = { facets: [{ name: 'garment_category', value: [1] }] };
    const response = { status: 200, statusText: 'OK', data: { items: [123] } };
    vi.mocked(axios.post).mockResolvedValue(response);
    expect(await httpPost(url, body)).toBe(response);
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(url, body);
    const [request, received] = entries();
    expect(request).toMatchObject({
      phase: 'REQUEST',
      method: 'POST',
      url,
      body,
    });
    expect(received).toMatchObject({
      phase: 'RESPONSE',
      requestId: request.requestId,
      method: 'POST',
      url,
      status: 200,
      statusText: 'OK',
      body: { items: [123] },
      durationMs: expect.any(Number),
    });
  });

  it('logs GETs with no body and redacts OAuth credentials without changing the response', async () => {
    const url =
      'https://fashion.example/api/oauth/token?client_id=shop&code=secret-code&code_verifier=secret-verifier';
    const credentials = {
      access_token: 'secret-access',
      refresh_token: 'secret-refresh',
      expires_in: 3600,
    };
    const response = { status: 200, statusText: 'OK', data: credentials };
    vi.mocked(axios.get).mockResolvedValue(response);
    expect(await httpGet(url)).toBe(response);
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(url);
    const [request, received] = entries();
    expect(request.body).toBeNull();
    expect(request.url).toBe(
      'https://fashion.example/api/oauth/token?client_id=shop&code=[REDACTED]&code_verifier=[REDACTED]'
    );
    expect(received.body).toEqual({
      access_token: '[REDACTED]',
      refresh_token: '[REDACTED]',
      expires_in: 3600,
    });
    expect(credentials.access_token).toBe('secret-access');
    expect(JSON.stringify(entries())).not.toContain('secret-');
  });

  it('logs HTTP error responses and rethrows the same error', async () => {
    const error = Object.assign(new Error('Unauthorized'), {
      response: {
        status: 401,
        data: { error: 'expired', access_token: 'secret' },
      },
    });
    vi.mocked(axios.post).mockRejectedValue(error);
    await expect(
      httpPost('https://fashion.example/api/oauth/token')
    ).rejects.toBe(error);
    expect(entries()[1]).toMatchObject({
      phase: 'ERROR',
      status: 401,
      body: { error: 'expired', access_token: '[REDACTED]' },
      error: { name: 'Error', message: 'Unauthorized' },
    });
  });

  it('prints complete token fields when explicitly enabled and restores redaction when disabled', async () => {
    const url =
      'https://fashion.example/api/oauth/token?refresh_token=private-query-token';
    const credentials = {
      access_token: 'complete-access-token',
      refresh_token: 'complete-refresh-token',
      expires_in: 3600,
      client_secret: 'private-client-secret',
    };
    const response = { status: 200, statusText: 'OK', data: credentials };
    vi.mocked(axios.post).mockResolvedValue(response);

    Log.init(true, true);
    expect(await httpPost(url)).toBe(response);
    expect(entries()[1].body).toEqual({
      ...credentials,
      client_secret: '[REDACTED]',
    });
    expect(entries()[0].url).toContain('refresh_token=[REDACTED]');
    expect(credentials.client_secret).toBe('private-client-secret');

    Log.init(true);
    await httpPost(url);
    expect(entries()[3].body).toMatchObject({
      access_token: '[REDACTED]',
      refresh_token: '[REDACTED]',
    });

    Log.init(false, true);
    await httpPost(url);
    expect(entries()).toHaveLength(4);
  });

  it('logs network failures without inventing an HTTP status or response', async () => {
    const error = new TypeError('Network request failed');
    vi.mocked(axios.get).mockRejectedValue(error);
    await expect(httpGet('https://fashion.example/api/items')).rejects.toBe(
      error
    );
    expect(entries()[1]).toMatchObject({
      phase: 'ERROR',
      status: null,
      body: null,
      error: { message: 'Network request failed' },
    });
  });

  it('respects enableLogging changes and keeps logging after individual log calls', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: [],
    });
    Log.init(false);
    await httpGet('https://fashion.example/one');
    expect(entries()).toHaveLength(0);
    Log.init(true);
    Log.info('Still enabled');
    await httpGet('https://fashion.example/two');
    expect(entries()).toHaveLength(2);
    Log.init(false);
    await httpGet('https://fashion.example/three');
    expect(entries()).toHaveLength(2);
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it('does not fail a request when the console throws', async () => {
    vi.mocked(console.info).mockImplementationOnce(() => {
      throw new Error('console failed');
    });
    const response = { status: 200, statusText: 'OK', data: { ok: true } };
    vi.mocked(axios.get).mockResolvedValue(response);
    await expect(httpGet('https://fashion.example/items')).resolves.toBe(
      response
    );
  });
});

describe('Fashion collector request logs', () => {
  const url = 'https://fashion.example/t/t';

  it('decodes event and page context copies while preserving request and response bodies', async () => {
    const contexts = {
      data: [
        {
          schema:
            'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0',
          data: { id: 'source-page' },
        },
      ],
    };
    const event = {
      data: {
        schema: 'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
        data: { request_id: 'api-request', dressipi_item_id: 123 },
      },
    };
    const body = JSON.stringify({
      data: [
        {
          eid: 'click-id',
          cx: Buffer.from(JSON.stringify(contexts)).toString('base64url'),
          ue_px: Buffer.from(JSON.stringify(event)).toString('base64url'),
        },
      ],
    });
    const response = new Response('accepted', {
      status: 200,
      statusText: 'OK',
    });
    const fetch = vi.fn(async (request: Request) => {
      expect(await request.text()).toBe(body);
      return response;
    });
    vi.stubGlobal('fetch', fetch);
    const request = new Request(url, { method: 'POST', body });
    const result = await fetchWithLogging(request);
    expect(result).toBe(response);
    expect(await result.text()).toBe('accepted');
    await vi.waitFor(() => expect(entries()).toHaveLength(2));
    expect(entries()[0]).toMatchObject({
      phase: 'REQUEST',
      url,
      method: 'POST',
      body: JSON.parse(body),
      decodedEvents: [
        {
          eventId: 'click-id',
          parentPageViewId: 'source-page',
          event,
          contexts,
        },
      ],
    });
    expect(entries()[1]).toMatchObject({
      phase: 'RESPONSE',
      requestId: entries()[0].requestId,
      status: 200,
      body: 'accepted',
    });
  });

  it.each([true, false])(
    'logs the item_view parent ID from the actual serialized context (base64: %s)',
    async base64 => {
      const pageId = '64ce6ae7-a4b2-4b38-90d7-b2031585f91c';
      const built = await productDetailPageView({
        product_code: 'product-1',
        sku: 'sku-1',
        parentPageViewId: pageId,
      });
      logTrackingEvent(built, 'QUEUED', 'tracker_not_ready');
      expect(
        vi
          .mocked(console.info)
          .mock.calls.some(([message]) =>
            String(message).includes(
              `item_view QUEUED parentPageViewId=${pageId}`
            )
          )
      ).toBe(true);
      const payloads: Record<string, unknown>[] = [];
      const core = trackerCore({
        base64,
        callback: payload => payloads.push(payload.build()),
      });
      core.track(
        buildSelfDescribingEvent({
          event: built.data[0] as { schema: string; data: unknown },
        }),
        built.data[1]
      );
      const body = JSON.stringify({ data: payloads });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
      await fetchWithLogging(new Request(url, { method: 'POST', body }));
      await vi.waitFor(() => expect(entries()).toHaveLength(2));
      expect(payloads[0].e).toBe('ue');
      expect(entries()[0].decodedEvents[0]).toMatchObject({
        parentPageViewId: pageId,
        event: {
          data: {
            schema: 'iglu:com.dressipi/item_view/jsonschema/1-0-0',
            data: { item: { product_code: 'product-1', sku: 'sku-1' } },
          },
        },
      });
      expect(entries()[0].decodedEvents[0].parentPageViewId).not.toBe(
        payloads[0].eid
      );
      expect(
        entries()[0].decodedEvents[0].event.data.data.item
      ).not.toHaveProperty('parentPageViewId');
      expect(entries()[0].body).toEqual(JSON.parse(body));
    }
  );

  it.each([true, false])(
    'shows the parent ID from the serialized context (base64: %s)',
    async base64 => {
      const pageId = '64ce6ae7-a4b2-4b38-90d7-b2031585f91c';
      const payloads: Record<string, unknown>[] = [];
      const core = trackerCore({
        base64,
        callback: payload => payloads.push(payload.build()),
      });
      const contexts = [
        {
          schema:
            'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0',
          data: { id: pageId },
        },
      ];
      const click = buildSelfDescribingEvent({
        event: {
          schema: 'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
          data: {
            request_id: 'request',
            related_items_set_id: 'set',
            dressipi_item_id: 123,
          },
        },
      });
      core.track(buildPageView({ pageUrl: '/pdp/source' }), contexts);
      core.track(click, contexts);
      const body = JSON.stringify({ data: payloads });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
      await fetchWithLogging(new Request(url, { method: 'POST', body }));
      await vi.waitFor(() => expect(entries()).toHaveLength(2));
      const decoded = entries()[0].decodedEvents;
      expect(decoded[0].pageViewId).toBe(pageId);
      expect(decoded[0]).not.toHaveProperty('parentPageViewId');
      expect(decoded[1].parentPageViewId).toBe(pageId);
      expect(decoded[1].parentPageViewId).not.toBe(decoded[1].eventId);
      expect(entries()[0].body).toEqual(JSON.parse(body));
    }
  );

  it('reports a missing recommendation page context explicitly instead of substituting the event ID', async () => {
    const body = {
      data: [
        {
          eid: 'event-id-is-not-a-page-id',
          ue_pr: JSON.stringify({
            data: {
              schema: 'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
              data: { dressipi_item_id: 123 },
            },
          }),
        },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    await fetchWithLogging(
      new Request(url, { method: 'POST', body: JSON.stringify(body) })
    );
    await vi.waitFor(() => expect(entries()).toHaveLength(2));
    expect(entries()[0].decodedEvents[0]).toMatchObject({
      eventId: 'event-id-is-not-a-page-id',
      parentPageViewId: null,
    });
  });

  it('logs each retry separately, including failed HTTP responses and empty bodies', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('retry later', { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const first = await fetchWithLogging(
      new Request(url, { method: 'POST', body: '{}' })
    );
    expect(first.status).toBe(503);
    const second = await fetchWithLogging(
      new Request(url, { method: 'POST', body: '{}' })
    );
    expect(second.status).toBe(204);
    await vi.waitFor(() => expect(entries()).toHaveLength(4));
    const requests = entries().filter(entry => entry.phase === 'REQUEST');
    const responses = entries().filter(entry => entry.phase === 'RESPONSE');
    expect(requests[0].requestId).not.toBe(requests[1].requestId);
    expect(responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestId: requests[0].requestId,
          status: 503,
          body: 'retry later',
        }),
        expect.objectContaining({
          requestId: requests[1].requestId,
          status: 204,
          body: '',
        }),
      ])
    );
  });

  it('preserves cancellation options and logs the original network error', async () => {
    const error = new DOMException('Aborted', 'AbortError');
    const fetch = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const request = new Request(url);
    const options = { signal: controller.signal };
    await expect(fetchWithLogging(request, options)).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(request, options);
    await vi.waitFor(() => expect(entries()).toHaveLength(2));
    expect(entries()[1]).toMatchObject({
      phase: 'ERROR',
      status: null,
      error: { name: 'AbortError' },
    });
  });

  it('passes through without reading/cloning bodies when disabled', async () => {
    Log.init(false);
    const request = new Request(url);
    const clone = vi.spyOn(request, 'clone');
    const response = new Response('ok');
    const responseClone = vi.spyOn(response, 'clone');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    expect(await fetchWithLogging(request)).toBe(response);
    expect(clone).not.toHaveBeenCalled();
    expect(responseClone).not.toHaveBeenCalled();
    expect(entries()).toHaveLength(0);
  });

  it('reports body read failures without failing delivery', async () => {
    const response = new Response('ok');
    vi.spyOn(response, 'clone').mockImplementation(() => {
      throw new Error('unreadable');
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    expect(await fetchWithLogging(new Request(url))).toBe(response);
    await vi.waitFor(() => expect(entries()).toHaveLength(2));
    expect(entries()[1].body).toBe('[Body unavailable for logging]');
    expect(await response.text()).toBe('ok');
  });
});

it('redacts credential fields in existing SDK logs too, without hiding page IDs', () => {
  Log.info('Credentials', 'useAuth.ts', {
    access_token: 'secret',
    headers: {
      Authorization: 'Bearer secret',
      'x-dressipi-jwt': 'private-jwt',
    },
    parentPageViewId: 'page-id',
  });
  const logged = String(vi.mocked(console.info).mock.calls[0][1]);
  expect(logged).not.toContain('secret');
  expect(logged).not.toContain('private-jwt');
  expect(logged).toContain('page-id');
  expect(logged).toContain('[REDACTED]');
});
