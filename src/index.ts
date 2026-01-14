import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pdfToPng } from "./pdf/pdfToPng";
import { groupLines } from "./ocr/groupLines";
import { runOcr } from "./ocr/tesseract";
import { writePptx } from "./pptx/pptxWriter";
import { writeDebugOverlay } from "./utils/debugOverlay";
import { parsePageRange } from "./utils/pages";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "Input PDF path")
  .requiredOption("-o, --out <path>", "Output PPTX path")
  .option("--dpi <number>", "DPI for PDF rasterization", "200")
  .option("--lang <string>", "Tesseract language", "jpn")
  .option("--pages <string>", "Page range, e.g. 1-3,7,10-12")
  .option("--debug", "Enable debug outputs", false)
  .parse(process.argv);

const run = async () => {
  const options = program.opts();
  const inputPath = options.input as string;
  const outputPath = options.out as string;
  const dpi = Number.parseInt(options.dpi as string, 10);
  const lang = options.lang as string;
  const pages = parsePageRange(options.pages as string | undefined);
  const outputDir = dirname(outputPath);
  const pagesDir = join(outputDir, "pages");
  const debugDir = options.debug ? join(outputDir, "debug") : undefined;

  await mkdir(outputDir, { recursive: true });

  console.log("[1/4] Rasterizing PDF...");
  const pageImages = await pdfToPng({
    inputPath,
    outputDir: pagesDir,
    dpi,
    pages,
  });

  if (pageImages.length === 0) {
    throw new Error("No pages were generated from the PDF.");
  }

  const slides = [];

  console.log("[2/4] Running OCR...");
  for (const imagePath of pageImages) {
    const base = basename(imagePath, ".png");
    const ocr = await runOcr(imagePath, {
      lang,
      dpi,
      debugDir,
      preprocess: true,
    });

    if (debugDir) {
      await mkdir(debugDir, { recursive: true });
      await writeFile(join(debugDir, `${base}.words.json`), JSON.stringify(ocr.words, null, 2));
    }

    const lines = groupLines(ocr.words, { minConfidence: 35 });

    if (debugDir) {
      await writeFile(join(debugDir, `${base}.lines.json`), JSON.stringify(lines, null, 2));
      await writeDebugOverlay(
        imagePath,
        join(debugDir, `${base}.overlay.png`),
        ocr.words
      );
    }

    slides.push({ imagePath, lines, dpi });
  }

  console.log("[3/4] Writing PPTX...");
  await writePptx(slides, outputPath);

  console.log("[4/4] Done.");
  console.log(`Output: ${outputPath}`);
};

run().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
