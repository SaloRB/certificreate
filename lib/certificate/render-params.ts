import { parseBrandColors } from "@/lib/brand/colors";
import { resolveTemplateId } from "@/lib/templates/resolve";
import type { BrandColors } from "@/types/brand";
import type { CertificateInput } from "@/types/certificate";

/** Both directions of the /render/certificate query string live here so the
 *  export routes and the render page can never disagree on a param name. */

export interface RenderPayload {
  input: CertificateInput;
  colors: BrandColors;
}

export function toRenderParams(
  input: CertificateInput,
  colors?: BrandColors,
): URLSearchParams {
  const params = new URLSearchParams({
    recipientName: input.recipientName,
    courseTitle: input.courseTitle,
    date: input.date,
    instructor: input.instructor,
    templateId: input.templateId,
  });

  // Omitted when empty, so an unbranded export produces the same URL it always
  // did and a stray `colors=` never has to be interpreted.
  if (colors && Object.keys(colors).length > 0) {
    params.set("colors", JSON.stringify(colors));
  }

  return params;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** A query string is untrusted whoever built it, so the colours are revalidated
 *  here rather than trusted because an export route sent them. */
function decodeColors(raw: string): BrandColors {
  if (!raw) return {};

  try {
    return parseBrandColors(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function fromRenderParams(params: RawParams): RenderPayload {
  return {
    input: {
      recipientName: first(params.recipientName),
      courseTitle: first(params.courseTitle),
      date: first(params.date),
      instructor: first(params.instructor),
      templateId: resolveTemplateId(first(params.templateId)),
    },
    colors: decodeColors(first(params.colors)),
  };
}
