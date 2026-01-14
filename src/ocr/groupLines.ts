import { OcrWord } from "./tesseract";

export interface OcrLine {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  words: OcrWord[];
}

export interface GroupLinesOptions {
  yThresholdRatio?: number;
  minConfidence?: number;
  fontScale?: number;
}

interface LineBucket {
  words: OcrWord[];
  top: number;
  bottom: number;
  centerY: number;
}

export const groupLines = (
  words: OcrWord[],
  options: GroupLinesOptions = {}
): OcrLine[] => {
  const yThresholdRatio = options.yThresholdRatio ?? 0.5;
  const minConfidence = options.minConfidence ?? 40;
  const fontScale = options.fontScale ?? 0.75;

  const filtered = words.filter((word) => word.confidence >= minConfidence);
  const sorted = filtered.sort(
    (a, b) => a.top + a.height / 2 - (b.top + b.height / 2) || a.left - b.left
  );

  const lines: LineBucket[] = [];

  for (const word of sorted) {
    const centerY = word.top + word.height / 2;
    const threshold = word.height * yThresholdRatio;
    let bucket = lines.find((line) => Math.abs(line.centerY - centerY) <= threshold);

    if (!bucket) {
      bucket = {
        words: [],
        top: word.top,
        bottom: word.top + word.height,
        centerY,
      };
      lines.push(bucket);
    }

    bucket.words.push(word);
    bucket.top = Math.min(bucket.top, word.top);
    bucket.bottom = Math.max(bucket.bottom, word.top + word.height);
    bucket.centerY = (bucket.top + bucket.bottom) / 2;
  }

  return lines
    .map((line) => {
      const sortedWords = line.words.sort((a, b) => a.left - b.left);
      const left = Math.min(...sortedWords.map((w) => w.left));
      const right = Math.max(...sortedWords.map((w) => w.left + w.width));
      const top = Math.min(...sortedWords.map((w) => w.top));
      const bottom = Math.max(...sortedWords.map((w) => w.top + w.height));
      const height = bottom - top;
      return {
        text: sortedWords.map((w) => w.text).join(" "),
        left,
        top,
        width: right - left,
        height,
        fontSize: Math.max(6, Math.round(height * fontScale)),
        words: sortedWords,
      };
    })
    .sort((a, b) => a.top - b.top);
};
