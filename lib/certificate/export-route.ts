import {
  certificateFileName,
  parseCertificateInput,
} from "@/lib/certificate/export-request";
import type { CertificateInput } from "@/types/certificate";

const GENERIC_ERROR = "Could not generate the certificate. Please try again.";

interface ExportOptions {
  contentType: string;
  extension: string;
  render: (input: CertificateInput) => Promise<Uint8Array<ArrayBuffer>>;
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
    const file = await render(parsed.input);
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${certificateFileName(parsed.input, extension)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`${extension.toUpperCase()} export failed`, error);
    return Response.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
