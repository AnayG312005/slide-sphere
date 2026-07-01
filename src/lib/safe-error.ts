/**
 * Wrap unexpected/internal errors so raw DB, PostgREST, or upstream AI-gateway
 * messages never reach the client. Log the original server-side; throw a
 * generic message to the caller.
 *
 * Intentional, safe application error codes (e.g. INSUFFICIENT_CREDITS,
 * PREMIUM_REQUIRED, "Forbidden", "Not found") should be thrown directly by
 * callers and NOT routed through this helper.
 */
export function internalError(context: string, err: unknown): Error {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err);
  return new Error("Operation failed. Please try again.");
}
