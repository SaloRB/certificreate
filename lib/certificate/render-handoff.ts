import { randomUUID } from "node:crypto";

/** Server-only handoff between an export route and the render page it
 *  photographs. A logo data URL cannot ride in the render URL: Node rejects a
 *  request line past its header limit long before a browser would, so the export
 *  stores the image here and puts a token in the query string instead.
 *
 *  In-process on purpose. The render page is fetched over loopback from this same
 *  server, so a token never has to resolve anywhere else. */

interface StoredLogo {
  logoDataUrl: string;
  expiresAt: number;
}

/** Long enough for a slow render, short enough that a crashed capture cannot
 *  hold an image in memory for any meaningful time. */
const TTL_MS = 60_000;

/** Hung off `globalThis`, not a module-level binding. Next compiles the route
 *  handler and the render page into different layers of the same process, so each
 *  gets its own copy of a module and a plain `const` map would have the export
 *  route storing a logo the page can never see. */
const STORE = Symbol.for("certificreate.render-logos");

const globalStore = globalThis as typeof globalThis & {
  [STORE]?: Map<string, StoredLogo>;
};

const logos = (globalStore[STORE] ??= new Map<string, StoredLogo>());

function sweep(now: number) {
  for (const [token, stored] of logos) {
    if (stored.expiresAt <= now) logos.delete(token);
  }
}

export function putRenderLogo(logoDataUrl: string): string {
  const token = randomUUID();
  sweep(Date.now());
  logos.set(token, { logoDataUrl, expiresAt: Date.now() + TTL_MS });

  return token;
}

/** Single use: the render page reads a token once, and a replay gets nothing. */
export function takeRenderLogo(token: string): string | null {
  const stored = logos.get(token);
  if (!stored) return null;

  logos.delete(token);

  return stored.expiresAt > Date.now() ? stored.logoDataUrl : null;
}

/** Called when a capture ends, so a failed render does not leave its image
 *  sitting in memory until the TTL catches it. */
export function dropRenderLogo(token: string): void {
  logos.delete(token);
}
