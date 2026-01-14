import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";
import { runCommand } from "../utils/command";

export interface OcrWord {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  confidence: number;
}

export interface OcrResult {
  words: OcrWord[];
  tsv: string;
}

export interface OcrOptions {
  lang: string;
  dpi: number;
  debugDir?: string;
  preprocess?: boolean;
}

const preprocessImage = async (imagePath: string, outputPath: string) => {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width ? Math.round(metadata.width * 1.2) : undefined;
  const height = metadata.height ? Math.round(metadata.height * 1.2) : undefined;

  await image
    .grayscale()
    .normalize()
    .resize({ width, height })
    .toFile(outputPath);
};

export const runOcr = async (
  imagePath: string,
  options: OcrOptions
): Promise<OcrResult> => {
  const debugDir = options.debugDir;
  let targetPath = imagePath;

  if (options.preprocess && debugDir) {
    await mkdir(debugDir, { recursive: true });
    const preprocessedPath = join(debugDir, `${basename(imagePath, ".png")}_pre.png`);
    await preprocessImage(imagePath, preprocessedPath);
    targetPath = preprocessedPath;
  }

  const args = [
    targetPath,
    "stdout",
    "-l",
    options.lang,
    "--dpi",
    `${options.dpi}`,
    "tsv",
  ];

  const result = await runCommand("tesseract", args);
  if (result.exitCode !== 0) {
    throw new Error(
      `tesseract failed. Ensure tesseract-ocr is installed and on PATH.\n${result.stderr}`
    );
  }

  if (debugDir) {
    await writeFile(join(debugDir, `${basename(imagePath, ".png")}.tsv`), result.stdout);
  }

  const words = parseTsv(result.stdout);
  return { words, tsv: result.stdout };
};

export const parseTsv = (tsv: string): OcrWord[] => {
  const lines = tsv.split("\n").slice(1);
  const words: OcrWord[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 12) continue;
    const [
      ,
      ,
      ,
      ,
      left,
      top,
      width,
      height,
      ,
      confidence,
      text,
    ] = parts;
    if (!text || text.trim().length === 0) continue;
    words.push({
      text: text.trim(),
      left: Number.parseInt(left, 10),
      top: Number.parseInt(top, 10),
      width: Number.parseInt(width, 10),
      height: Number.parseInt(height, 10),
      confidence: Number.parseFloat(confidence),
    });
  }

  return words;
};
