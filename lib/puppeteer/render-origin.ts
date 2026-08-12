const DEFAULT_PORT = 3000;

/** Origin Chrome should load the render page from.
 *
 *  Never derive this from the incoming request. Behind Render's TLS-terminating
 *  proxy the request reports scheme https with host localhost:10000, so Chrome
 *  would speak TLS to a plain-HTTP server and fail with ERR_SSL_PROTOCOL_ERROR.
 *  Chrome runs in the same container as the server, so it always goes straight
 *  to loopback over http and skips the proxy entirely. */
export function renderOrigin(rawPort = process.env.PORT): string {
  const port = Number(rawPort);
  const valid = rawPort !== "" && Number.isInteger(port) && port > 0 && port <= 65535;
  return `http://127.0.0.1:${valid ? port : DEFAULT_PORT}`;
}
