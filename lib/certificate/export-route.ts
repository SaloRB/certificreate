import {
  certificateFileName,
  parseCertificateInput,
} from "@/lib/certificate/export-request";
import {
  RenderOverloadError,
  RenderTimeoutError,
} from "@/lib/puppeteer/errors";
import type { ExportBrand } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

const GENERIC_ERROR = "Could not generate the certificate. Please try again.";
const BUSY_ERROR =
  "The certificate service is busy right now. Please try again in a moment.";
const TIMEOUT_ERROR =
  "The certificate took too long to render. Please try again.";

interface ExportOptions {
  contentType: string;
  extension: string;
  render: (
    input: CertificateInput,
    brand: ExportBrand,
  ) => Promise<Uint8Array<ArrayBuffer>>;
}

/** Parse, validate, render, and attach the download headers. Shared by both
 *  export routes so they cannot drift on status codes, and so neither can start
 *  leaking an exception message to the client. */
export async function handleExportRequest(
  request: Request,
  { contentType, extension, render }: ExportOptions,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = parseCertificateInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const file = await render(parsed.input, parsed.brand);
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${certificateFileName(parsed.input, extension)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Load, not breakage: the queue turned the request away before starting it,
    // so the honest answer is "come back", not "something went wrong".
    if (error instanceof RenderOverloadError) {
      console.warn(`${extension.toUpperCase()} export refused: queue full`);
      return Response.json(
        { error: BUSY_ERROR },
        {
          status: 503,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }

    if (error instanceof RenderTimeoutError) {
      console.error(`${extension.toUpperCase()} export timed out`);
      return Response.json({ error: TIMEOUT_ERROR }, { status: 504 });
    }

    console.error(`${extension.toUpperCase()} export failed`, error);
    return Response.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
