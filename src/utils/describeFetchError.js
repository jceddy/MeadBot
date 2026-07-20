// describeFetchError(error) - Node's global fetch() throws a bare `TypeError: fetch failed` on
// any low-level connection failure (DNS resolution, connection refused, TLS, etc.) -- the actual
// reason lives in error.cause, not error.message, so a bare error.message is nearly useless for
// diagnosing what actually went wrong. Appends the cause when present.
module.exports = function describeFetchError(error) {
  if (error.cause) {
    const causeText = error.cause instanceof Error ? error.cause.message : String(error.cause);
    return `${error.message}: ${causeText}`;
  }
  return error.message;
};
