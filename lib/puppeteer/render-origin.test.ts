import { describe, expect, it } from "vitest";

import { renderOrigin } from "./render-origin";

describe("renderOrigin", () => {
  it("uses the port the server was told to listen on", () => {
    expect(renderOrigin("10000")).toBe("http://127.0.0.1:10000");
  });

  it("defaults to 3000 when PORT is unset", () => {
    expect(renderOrigin(undefined)).toBe("http://127.0.0.1:3000");
  });

  it.each(["", "abc", "0", "-1", "70000", "3000.5"])(
    "falls back to 3000 for unusable PORT %j",
    (port) => {
      expect(renderOrigin(port)).toBe("http://127.0.0.1:3000");
    },
  );

  it("never emits https, which the local server does not speak", () => {
    expect(renderOrigin("10000")).toMatch(/^http:\/\//);
  });
});
