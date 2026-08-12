import { describe, expect, it } from "vitest";

import {
  formatCertificateDate,
  isCertificateDate,
  toIsoDate,
} from "@/lib/certificate/date";

describe("toIsoDate", () => {
  it("converts the printed format", () => {
    expect(toIsoDate("07/13/2026")).toBe("2026-07-13");
    expect(toIsoDate("01/01/2000")).toBe("2000-01-01");
  });

  it("accepts a value that is already ISO", () => {
    expect(toIsoDate("2026-07-13")).toBe("2026-07-13");
  });

  it("tolerates surrounding whitespace", () => {
    expect(toIsoDate("  07/13/2026 ")).toBe("2026-07-13");
  });

  it("keeps a leap day and rejects the day that does not exist", () => {
    expect(toIsoDate("02/29/2024")).toBe("2024-02-29");
    expect(toIsoDate("02/29/2025")).toBeNull();
    expect(toIsoDate("02/30/2026")).toBeNull();
    expect(toIsoDate("13/01/2026")).toBeNull();
  });

  it("rejects anything it cannot round-trip", () => {
    for (const value of [
      "",
      "   ",
      "July 13, 2026",
      "7/13/2026",
      "2026/07/13",
      "13-07-2026",
      "not a date",
    ]) {
      expect(toIsoDate(value)).toBeNull();
    }
  });
});

describe("formatCertificateDate", () => {
  it("prints ISO in the certificate format", () => {
    expect(formatCertificateDate("2026-07-13")).toBe("07/13/2026");
    expect(formatCertificateDate("2000-01-01")).toBe("01/01/2000");
  });

  it("returns an empty string for a cleared or unusable picker value", () => {
    for (const value of ["", "  ", "07/13/2026", "2026-02-30", "nope"]) {
      expect(formatCertificateDate(value)).toBe("");
    }
  });

  it("round-trips with toIsoDate", () => {
    const display = "12/31/2027";

    expect(formatCertificateDate(toIsoDate(display)!)).toBe(display);
  });
});

describe("isCertificateDate", () => {
  it("mirrors what the picker can represent", () => {
    expect(isCertificateDate("07/13/2026")).toBe(true);
    expect(isCertificateDate("July 13, 2026")).toBe(false);
    expect(isCertificateDate("")).toBe(false);
  });
});
