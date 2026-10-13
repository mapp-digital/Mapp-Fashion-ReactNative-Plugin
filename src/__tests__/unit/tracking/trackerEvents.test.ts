import CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import { identify } from '../../../tracking/trackerEvents';

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
