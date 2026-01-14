import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";
import pptxgen from "pptxgenjs";
import { OcrLine } from "../ocr/groupLines";

export interface SlideContent {
  imagePath: string;
  lines: OcrLine[];
  dpi: number;
}

const pxToInches = (px: number, dpi: number) => px / dpi;

export const writePptx = async (
  slides: SlideContent[],
  outputPath: string
): Promise<void> => {
  const pptx = new pptxgen();

  const firstMeta = await sharp(slides[0].imagePath).metadata();
  const widthPx = firstMeta.width ?? 0;
  const heightPx = firstMeta.height ?? 0;
  const dpi = slides[0].dpi;

  const widthIn = pxToInches(widthPx, dpi);
  const heightIn = pxToInches(heightPx, dpi);

  const layoutName = "CUSTOM";
  pptx.defineLayout({ name: layoutName, width: widthIn, height: heightIn });
  pptx.layout = layoutName;

  for (const slideContent of slides) {
    const slide = pptx.addSlide();
    slide.addImage({ path: slideContent.imagePath, x: 0, y: 0, w: widthIn, h: heightIn });

    for (const line of slideContent.lines) {
      const x = pxToInches(line.left, slideContent.dpi);
      const y = pxToInches(line.top, slideContent.dpi);
      const w = pxToInches(line.width + 8, slideContent.dpi);
      const h = pxToInches(line.height + 4, slideContent.dpi);

      slide.addText(line.text, {
        x,
        y,
        w,
        h,
        fontSize: line.fontSize,
        color: "000000",
        autoFit: true,
        valign: "top",
      });
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await pptx.writeFile({ fileName: outputPath });
};
