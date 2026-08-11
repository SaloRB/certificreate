import type { CertificateInput } from "@/types/certificate";

/** Both directions of the /render/certificate query string live here so the
 *  export routes and the render page can never disagree on a param name. */

export function toRenderParams(input: CertificateInput): URLSearchParams {
  return new URLSearchParams({
    recipientName: input.recipientName,
    courseTitle: input.courseTitle,
    date: input.date,
    instructor: input.instructor,
    templateId: input.templateId,
  });
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function fromRenderParams(params: RawParams): CertificateInput {
  return {
    recipientName: first(params.recipientName),
    courseTitle: first(params.courseTitle),
    date: first(params.date),
    instructor: first(params.instructor),
    templateId: first(params.templateId) || "black-border",
  };
}
