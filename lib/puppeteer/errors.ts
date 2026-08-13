/** Raised when the render queue is already full, so the request was never
 *  started. The caller answers 503 rather than holding the connection open. */
export class RenderOverloadError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Render queue is full");
    this.name = "RenderOverloadError";
  }
}

/** Raised when a render held its slot past the deadline. The page is abandoned
 *  so one stuck capture cannot occupy a slot for the life of the process. */
export class RenderTimeoutError extends Error {
  constructor() {
    super("Render exceeded its deadline");
    this.name = "RenderTimeoutError";
  }
}
