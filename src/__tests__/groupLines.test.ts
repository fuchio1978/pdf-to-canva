import { describe, expect, it } from "vitest";
import { groupLines } from "../ocr/groupLines";

describe("groupLines", () => {
  it("groups words on the same line", () => {
    const words = [
      { text: "Hello", left: 10, top: 10, width: 40, height: 10, confidence: 90 },
      { text: "World", left: 60, top: 12, width: 45, height: 10, confidence: 88 },
    ];

    const lines = groupLines(words);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("Hello World");
  });

  it("splits words into multiple lines", () => {
    const words = [
      { text: "Line1", left: 10, top: 10, width: 40, height: 10, confidence: 90 },
      { text: "Line2", left: 10, top: 40, width: 40, height: 10, confidence: 90 },
    ];

    const lines = groupLines(words, { yThresholdRatio: 0.3 });
    expect(lines).toHaveLength(2);
    expect(lines[0].text).toBe("Line1");
    expect(lines[1].text).toBe("Line2");
  });
});
