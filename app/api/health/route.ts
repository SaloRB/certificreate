import { renderPoolStats } from "@/lib/puppeteer/browser";

export const runtime = "nodejs";
// Render polls this to decide whether the instance is live, so it must report
// the process it is running in rather than a value baked in at build time.
export const dynamic = "force-dynamic";

/** Liveness for Render's health check, and the before/after snapshot the load
 *  script reads. Answers 200 whenever the server is up: Chrome not being started
 *  yet is the normal state of an idle instance, not a fault, and answering 503
 *  for it would have Render restart a perfectly healthy service. */
export function GET() {
  return Response.json(
    {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      ...renderPoolStats(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
