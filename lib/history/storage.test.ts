import { describe, expect, it } from "vitest";

import {
  addEntry,
  deserializeHistory,
  HISTORY_LIMIT,
  parseHistory,
  parseHistoryEntry,
  removeEntry,
  serializeHistory,
  toCertificateInput,
} from "@/lib/history/storage";
import type { HistoryEntry } from "@/types/history";

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "entry-1",
    recipientName: "Ada Lovelace",
    courseTitle: "Analytical Engines",
    date: "07/13/2026",
    instructor: "Brad Traversy",
    templateId: "black-border",
    createdAt: 1_000,
    ...overrides,
  };
}

describe("parseHistoryEntry", () => {
  it("keeps a complete record", () => {
    expect(parseHistoryEntry(entry())).toEqual(entry());
  });

  it("keeps empty strings for the content fields", () => {
    const blank = entry({ recipientName: "", courseTitle: "", date: "" });
    expect(parseHistoryEntry(blank)).toEqual(blank);
  });

  it("drops a record missing a field", () => {
    const partial: Record<string, unknown> = { ...entry() };
    delete partial.instructor;

    expect(parseHistoryEntry(partial)).toBeNull();
  });

  it("drops a record with a wrong-typed field", () => {
    expect(parseHistoryEntry(entry({ recipientName: 42 as never }))).toBeNull();
    expect(parseHistoryEntry(entry({ createdAt: "1000" as never }))).toBeNull();
  });

  it("drops a record with an unusable createdAt", () => {
    expect(parseHistoryEntry(entry({ createdAt: Number.NaN }))).toBeNull();
  });

  it("drops a record with an empty id or templateId", () => {
    expect(parseHistoryEntry(entry({ id: "" }))).toBeNull();
    expect(parseHistoryEntry(entry({ templateId: "" }))).toBeNull();
  });

  it("returns null for a non-object", () => {
    expect(parseHistoryEntry(null)).toBeNull();
    expect(parseHistoryEntry("Ada")).toBeNull();
    expect(parseHistoryEntry(undefined)).toBeNull();
  });
});

describe("parseHistory", () => {
  it("drops the bad entries and keeps the rest", () => {
    expect(
      parseHistory([entry(), "nope", null, entry({ id: "entry-2" })]),
    ).toEqual([entry(), entry({ id: "entry-2" })]);
  });

  it("returns an empty list for a non-array", () => {
    expect(parseHistory({ entries: [entry()] })).toEqual([]);
    expect(parseHistory(null)).toEqual([]);
  });

  it("caps an oversized stored list", () => {
    const stored = Array.from({ length: HISTORY_LIMIT + 5 }, (_, index) =>
      entry({ id: `entry-${index}` }),
    );

    expect(parseHistory(stored)).toHaveLength(HISTORY_LIMIT);
  });
});

describe("deserializeHistory", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(deserializeHistory(null)).toEqual([]);
    expect(deserializeHistory("")).toEqual([]);
  });

  it("returns an empty list for malformed JSON", () => {
    expect(deserializeHistory("not json")).toEqual([]);
  });

  it("round-trips a written list", () => {
    const entries = [entry(), entry({ id: "entry-2" })];
    expect(deserializeHistory(serializeHistory(entries))).toEqual(entries);
  });
});

describe("addEntry", () => {
  it("prepends a new entry", () => {
    const existing = entry({ id: "entry-1" });
    const added = entry({ id: "entry-2", recipientName: "Grace Hopper" });

    expect(addEntry([existing], added)).toEqual([added, existing]);
  });

  it("moves an identical certificate to the top with the new timestamp", () => {
    const older = entry({ id: "entry-1", createdAt: 1_000 });
    const other = entry({ id: "entry-2", recipientName: "Grace Hopper" });
    const repeat = entry({ id: "entry-3", createdAt: 5_000 });

    expect(addEntry([other, older], repeat)).toEqual([
      { ...older, createdAt: 5_000 },
      other,
    ]);
  });

  it("treats a different instructor or template as a different certificate", () => {
    const original = entry({ id: "entry-1" });

    expect(
      addEntry([original], entry({ id: "entry-2", instructor: "Ada" })),
    ).toHaveLength(2);
    expect(
      addEntry([original], entry({ id: "entry-3", templateId: "modern-slate" })),
    ).toHaveLength(2);
  });

  it("evicts the oldest entry once the cap is reached", () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, index) =>
      entry({ id: `entry-${index}`, recipientName: `Recipient ${index}` }),
    );
    const added = entry({ id: "newest", recipientName: "Grace Hopper" });
    const result = addEntry(full, added);

    expect(result).toHaveLength(HISTORY_LIMIT);
    expect(result[0]).toEqual(added);
    expect(result.at(-1)?.id).toBe(`entry-${HISTORY_LIMIT - 2}`);
  });
});

describe("toCertificateInput", () => {
  it("drops the storage-only fields and keeps the payload", () => {
    expect(toCertificateInput(entry())).toEqual({
      recipientName: "Ada Lovelace",
      courseTitle: "Analytical Engines",
      date: "07/13/2026",
      instructor: "Brad Traversy",
      templateId: "black-border",
    });
  });
});

describe("removeEntry", () => {
  it("removes only the matching entry", () => {
    const kept = entry({ id: "entry-2" });
    expect(removeEntry([entry({ id: "entry-1" }), kept], "entry-1")).toEqual([
      kept,
    ]);
  });

  it("leaves the list alone for an unknown id", () => {
    const entries = [entry()];
    expect(removeEntry(entries, "missing")).toEqual(entries);
  });
});
