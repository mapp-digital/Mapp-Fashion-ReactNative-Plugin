import type { QueueableEvents, QueuedEvent } from '../types/tracking';
import { Log } from './logger';

/** Log SDK handoff separately from HTTP delivery, using the built event's context. */
export function logTrackingEvent(
  event: QueuedEvent<QueueableEvents>,
  status: 'QUEUED' | 'DISPATCHED',
  reason?: string
) {
  if (!Log.enabled) return;
  try {
    const contexts = event.data[1];
    const id = contexts?.find(
      context =>
        context.schema ===
        'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0'
    )?.data?.id;
    const pageId = typeof id === 'string' && id ? id : null;
    const schema = (event.data[0] as { schema?: string }).schema;
    const name = schema?.split('/')[1] ?? event.event;
    const pageField =
      event.event === 'trackPageViewEvent'
        ? 'pageViewId'
        : schema &&
            /^iglu:com\.dressipi\/(item_view|item_click_pdp|item_click_quickview|tab_click)\/jsonschema\//.test(
              schema
            )
          ? 'parentPageViewId'
          : undefined;

    Log.info(
      `${name} ${status}${pageField ? ` ${pageField}=${pageId}` : ''}${reason ? ` reason=${reason}` : ''}`,
      'Fashion Tracking',
      {
        status,
        event: event.event,
        ...(pageField ? { [pageField]: pageId } : {}),
        ...(reason ? { reason } : {}),
        data: event.data,
      }
    );
  } catch {
    // Diagnostics must not prevent queueing or handing an event to the tracker.
  }
}
