import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAST_FORM_VALUES,
  deserializeLastFormValues,
  parseLastFormValues,
  serializeLastFormValues,
} from "@/lib/certificate/last-values";
import { DEFAULT_CERTIFICATE_DRAFT } from "@/lib/certificate-defaults";

const stored = {
  draft: {
    recipientName: "Ada Lovelace",
    courseTitle: "Analytical Engines",
    date: "07/13/2026",
    templateId: "modern-slate",
  },
  instructorOverride: "Grace Hopper",
};

describe("parseLastFormValues", () => {
  it("keeps a complete record", () => {
    expect(parseLastFormValues(stored)).toEqual(stored);
  });

  it("keeps a null override rather than treating it as missing", () => {
    expect(
      parseLastFormValues({ ...stored, instructorOverride: null })
        .instructorOverride,
    ).toBeNull();
  });

  it("keeps an empty override, which is a cleared instructor", () => {
    expect(
      parseLastFormValues({ ...stored, instructorOverride: "" })
        .instructorOverride,
    ).toBe("");
  });

  it("fills in the draft fields a partial record is missing", () => {
    expect(
      parseLastFormValues({ draft: { recipientName: "Ada Lovelace" } }),
    ).toEqual({
      draft: { ...DEFAULT_CERTIFICATE_DRAFT, recipientName: "Ada Lovelace" },
      instructorOverride: null,
    });
  });

  it("falls back per field for a wrong-typed value", () => {
    expect(
      parseLastFormValues({
        draft: { ...stored.draft, date: 42 },
        instructorOverride: 7,
      }),
    ).toEqual({
      draft: { ...stored.draft, date: DEFAULT_CERTIFICATE_DRAFT.date },
      instructorOverride: null,
    });
  });

  it("returns defaults for a missing or non-object draft", () => {
    expect(parseLastFormValues({})).toEqual(DEFAULT_LAST_FORM_VALUES);
    expect(parseLastFormValues({ draft: "Ada" })).toEqual(
      DEFAULT_LAST_FORM_VALUES,
    );
  });

  it("returns defaults for a non-object", () => {
    expect(parseLastFormValues(null)).toEqual(DEFAULT_LAST_FORM_VALUES);
    expect(parseLastFormValues("Ada")).toEqual(DEFAULT_LAST_FORM_VALUES);
    expect(parseLastFormValues(undefined)).toEqual(DEFAULT_LAST_FORM_VALUES);
  });
});

describe("deserializeLastFormValues", () => {
  it("returns defaults when nothing is stored", () => {
    expect(deserializeLastFormValues(null)).toEqual(DEFAULT_LAST_FORM_VALUES);
    expect(deserializeLastFormValues("")).toEqual(DEFAULT_LAST_FORM_VALUES);
  });

  it("returns defaults for malformed JSON", () => {
    expect(deserializeLastFormValues("not json")).toEqual(
      DEFAULT_LAST_FORM_VALUES,
    );
  });

  it("round-trips a written record, null override included", () => {
    const values = { draft: stored.draft, instructorOverride: null };

    expect(
      deserializeLastFormValues(serializeLastFormValues(values)),
    ).toEqual(values);
  });
});
