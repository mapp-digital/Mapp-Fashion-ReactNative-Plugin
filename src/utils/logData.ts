const credentialKey =
  /^(authorization|proxy-authorization|x-dressipi-jwt|x-api-key|cookie|set-cookie|access_?token|refresh_?token|id_?token|client_secret|code_verifier|code|password)$/i;
const tokenKey = /^(access_?token|refresh_?token)$/i;
const credentialQuery =
  /(^|[?&])((?:access_token|refresh_token|id_token|client_secret|code_verifier|code|password)=)[^&#\s]*/gi;

export const sanitizeLogText = (value: string): string =>
  value
    .replace(credentialQuery, '$1$2[REDACTED]')
    .replace(/Bearer\s+[\w.~+/=-]+/gi, 'Bearer [REDACTED]');

/** Make a logging copy without changing credentials or payloads used by the SDK. */
export const sanitizeLogData = (
  value: unknown,
  logTokens = false,
  seen = new WeakSet<object>()
): unknown => {
  if (typeof value === 'string') return sanitizeLogText(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  const result = Array.isArray(value)
    ? value.map(item => sanitizeLogData(item, logTokens, seen))
    : Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          logTokens && tokenKey.test(key) && typeof item === 'string'
            ? item
            : credentialKey.test(key)
              ? '[REDACTED]'
              : sanitizeLogData(item, logTokens, seen),
        ])
      );
  seen.delete(value);
  return result;
};
