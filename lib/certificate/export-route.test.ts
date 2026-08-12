import { afterEach, describe, expect, it, vi } from "vitest";

import { handleExportRequest } from "@/lib/certificate/export-route";
import type { CertificateInput } from "@/types/certificate";

const VALID: CertificateInput = {
  recipientName: "Ada Lovelace",
  courseTitle: "Analytical Engines 101",
  date: "07/13/2026",
  instructor: "Brad Traversy",
  templateId: "black-border",
};

const BYTES = new Uint8Array([1, 2, 3]);

function post(body: string): Request {
  return new Request("http://localhost/api/export/png", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function options(overrides: Partial<Parameters<typeof handleExportRequest>[1]>) {
  return {
    contentType: "image/png",
    extension: "png",
    render: async () => BYTES,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleExportRequest", () => {
  it("returns the rendered bytes with download headers", async () => {
    const response = await handleExportRequest(
      post(JSON.stringify(VALID)),
      options({}),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="certificate-ada-lovelace.png"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES);
  });

  it("names the file from the content type it was given", async () => {
    const response = await handleExportRequest(
      post(JSON.stringify(VALID)),
      options({ contentType: "application/pdf", extension: "pdf" }),
    );

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="certificate-ada-lovelace.pdf"',
    );
  });

  it("passes the trimmed input to the renderer", async () => {
    const render = vi.fn(async () => BYTES);

    await handleExportRequest(
      post(JSON.stringify({ ...VALID, recipientName: "  Ada  " })),
      options({ render }),
    );

    expect(render).toHaveBeenCalledWith({ ...VALID, recipientName: "Ada" }, {
      colors: {},
      logoDataUrl: null,
    });
  });

  it("hands the validated brand values to the renderer", async () => {
    const render = vi.fn(async () => BYTES);

    await handleExportRequest(
      post(
        JSON.stringify({
          ...VALID,
          colors: {
            "--color-cert-ink": "#123456",
            "--color-cert-paper": "red;background:url(x)",
          },
          logoDataUrl: "data:image/png;base64,AAA=",
        }),
      ),
      options({ render }),
    );

    expect(render).toHaveBeenCalledWith(VALID, {
      colors: { "--color-cert-ink": "#123456" },
      logoDataUrl: "data:image/png;base64,AAA=",
    });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await handleExportRequest(post("not json"), options({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Expected a JSON body.",
    });
  });

  it("rejects an invalid input with the field message", async () => {
    const withoutName = { ...VALID, recipientName: "" };

    const response = await handleExportRequest(
      post(JSON.stringify(withoutName)),
      options({}),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Recipient name cannot be empty.",
    });
  });

  it("does not call the renderer when the input is invalid", async () => {
    const render = vi.fn(async () => BYTES);

    await handleExportRequest(post(JSON.stringify({})), options({ render }));

    expect(render).not.toHaveBeenCalled();
  });

  it("hides a render failure behind a generic 500", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const secret = "Chrome crashed at /Users/salo/secret/path";

    const response = await handleExportRequest(
      post(JSON.stringify(VALID)),
      options({
        render: async () => {
          throw new Error(secret);
        },
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).not.toContain(secret);
    expect(JSON.parse(body)).toEqual({
      error: "Could not generate the certificate. Please try again.",
    });
    expect(consoleError).toHaveBeenCalled();
  });
});
