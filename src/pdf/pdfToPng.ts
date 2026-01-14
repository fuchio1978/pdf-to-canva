import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runCommand } from "../utils/command";

export interface PdfToPngOptions {
  inputPath: string;
  outputDir: string;
  dpi: number;
  pages?: number[];
}

const buildPageArgs = (pages?: number[]): string[] => {
  if (!pages || pages.length === 0) return [];
  const minPage = Math.min(...pages);
  const maxPage = Math.max(...pages);
  if (pages.length === maxPage - minPage + 1) {
    return ["-f", `${minPage}`, "-l", `${maxPage}`];
  }
  return [];
};

export const pdfToPng = async ({
  inputPath,
  outputDir,
  dpi,
  pages,
}: PdfToPngOptions): Promise<string[]> => {
  await mkdir(outputDir, { recursive: true });
  const prefix = join(outputDir, "page");
  const pageArgs = buildPageArgs(pages);

  const args = [
    "-r",
    `${dpi}`,
    ...pageArgs,
    "-png",
    inputPath,
    prefix,
  ];

  const result = await runCommand("pdftoppm", args, { cwd: outputDir });

  if (result.exitCode !== 0) {
    throw new Error(
      `pdftoppm failed. Ensure poppler is installed and on PATH.\n${result.stderr}`
    );
  }

  const files = await readdir(outputDir);
  const images = files
    .filter((file) => file.startsWith("page-") && file.endsWith(".png"))
    .sort();

  if (pages && pages.length > 0 && images.length !== pages.length) {
    const filtered = images.filter((file) => {
      const match = /page-(\d+)\.png$/.exec(file);
      if (!match) return false;
      return pages.includes(Number.parseInt(match[1], 10));
    });
    return filtered.map((file) => join(outputDir, file));
  }

  return images.map((file) => join(outputDir, file));
};
