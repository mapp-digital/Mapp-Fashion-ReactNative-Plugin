import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { Log } from './logger';

let nextRequestId = 0;

const parseBody = (body: unknown): unknown => {
  if (typeof body === 'string' && body !== '') {
    try {
      return JSON.parse(body);
    } catch {
      /* Keep plain-text responses. */
    }
  }
  return body ?? null;
};

/** Decode a copy of Snowplow's encoded fields so page contexts are inspectable. */
const decodedEvents = (body: unknown): unknown => {
  const events = (body as { data?: unknown[] } | null)?.data;
  if (!Array.isArray(events)) return undefined;
  const decode = (value: string) => {
    try {
      const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(
        CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Utf8)
      );
    } catch {
      return '[Unable to decode]';
    }
  };
  return events.map(event => {
    const payload = event as Record<string, unknown> | null;
    const decodedEvent =
      typeof payload?.ue_px === 'string'
        ? decode(payload.ue_px)
        : parseBody(payload?.ue_pr);
    const contexts =
      typeof payload?.cx === 'string'
        ? decode(payload.cx)
        : parseBody(payload?.co);
    const entities = (
      contexts as {
        data?: { schema?: string; data?: { id?: unknown } }[];
      } | null
    )?.data;
    const pageId = Array.isArray(entities)
      ? entities.find(
          entity =>
            entity?.schema ===
            'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0'
        )?.data?.id
      : undefined;
    const schema = (decodedEvent as { data?: { schema?: unknown } } | null)
      ?.data?.schema;
    const isRecommendation =
      typeof schema === 'string' &&
      /^iglu:com\.dressipi\/(item_click_pdp|item_click_quickview|tab_click|carousel_navigate|carousel_paginate)\/jsonschema\//.test(
        schema
      );
    // Diagnostic aliases come only from the serialized context, never the event ID.
    const pageContextId = typeof pageId === 'string' && pageId ? pageId : null;
    return {
      eventId: payload?.eid,
      ...(payload?.e === 'pv' ? { pageViewId: pageContextId } : {}),
      ...(isRecommendation ? { parentPageViewId: pageContextId } : {}),
      event: decodedEvent,
      contexts,
    };
  });
};

const beginRequest = (method: string, url: string) => {
  const requestId = `fashion-${++nextRequestId}`;
  const started = Date.now();
  const metadata = { requestId, method, url };
  const write = (phase: string, details: object) => {
    // Diagnostics must never break a network request or its retry behavior.
    try {
      Log.info(`${requestId} ${phase}`, 'Fashion HTTP', {
        ...metadata,
        ...details,
      });
    } catch {
      /* Logging only. */
    }
  };
  return {
    request: (value: unknown) => {
      const body = parseBody(value);
      write('REQUEST', { body, decodedEvents: decodedEvents(body) });
    },
    response: (status: number, statusText: string, body: unknown) =>
      write('RESPONSE', {
        status,
        statusText,
        durationMs: Date.now() - started,
        body: parseBody(body),
      }),
    error: (error: unknown) => {
      const failure = error as AxiosError | null;
      write('ERROR', {
        durationMs: Date.now() - started,
        status: failure?.response?.status ?? null,
        body: parseBody(failure?.response?.data),
        error:
          typeof failure?.message === 'string'
            ? { name: failure.name, message: failure.message }
            : String(error),
      });
    },
  };
};

async function logAxios<T>(
  method: string,
  url: string,
  body: unknown,
  send: () => Promise<AxiosResponse<T>>
) {
  if (!Log.enabled) return send();
  const log = beginRequest(method, url);
  log.request(body);
  try {
    const response = await send();
    log.response(response.status, response.statusText, response.data);
    return response;
  } catch (error) {
    log.error(error);
    throw error;
  }
}

export const httpGet = <T>(
  ...args: [url: string, config?: AxiosRequestConfig]
) => logAxios('GET', args[0], args[1]?.data, () => axios.get<T>(...args));

export const httpPost = <T>(
  ...args: [url: string, body?: unknown, config?: AxiosRequestConfig]
) => logAxios('POST', args[0], args[1], () => axios.post<T>(...args));

const readBody = async (read: () => Promise<string>): Promise<unknown> => {
  try {
    return await read();
  } catch {
    return '[Body unavailable for logging]';
  }
};

/** Observe each collector attempt without consuming request/response bodies. */
export async function fetchWithLogging(
  request: Request,
  options?: RequestInit
): Promise<Response> {
  if (!Log.enabled) return fetch(request, options);
  const log = beginRequest(options?.method ?? request.method, request.url);
  // Clone before fetch consumes the original. Do not delay sending for logging.
  const requestLogged = (
    options?.body !== undefined
      ? Promise.resolve(options.body)
      : readBody(() => request.clone().text())
  ).then(body => log.request(body));
  try {
    const response = await fetch(request, options);
    const body = readBody(() => response.clone().text());
    void Promise.all([requestLogged, body])
      .then(([, value]) => {
        log.response(response.status, response.statusText, value);
      })
      .catch(() => {});
    return response;
  } catch (error) {
    void requestLogged.then(() => log.error(error)).catch(() => {});
    throw error;
  }
}
