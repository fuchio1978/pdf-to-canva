import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { OcrWord } from "../ocr/tesseract";

export const writeDebugOverlay = async (
  imagePath: string,
  outputPath: string,
  words: OcrWord[]
): Promise<void> => {
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const rects = words
    .map(
      (word) =>
        `<rect x="${word.left}" y="${word.top}" width="${word.width}" height="${word.height}" fill="none" stroke="red" stroke-width="2" />`
    )
    .join("\n");
  const svg = `<svg width="${width}" height="${height}">${rects}</svg>`;

  const buffer = await sharp(imagePath)
    .composite([{ input: Buffer.from(svg), blend: "over" }])
    .png()
    .toBuffer();

  await writeFile(outputPath, buffer);
};
