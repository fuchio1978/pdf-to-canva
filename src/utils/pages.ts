export const parsePageRange = (input?: string): number[] | undefined => {
  if (!input) return undefined;
  const pages = new Set<number>();
  const ranges = input.split(",").map((part) => part.trim());

  for (const range of ranges) {
    if (!range) continue;
    const [startRaw, endRaw] = range.split("-");
    const start = Number.parseInt(startRaw, 10);
    const end = endRaw ? Number.parseInt(endRaw, 10) : start;
    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new Error(`Invalid page range: ${range}`);
    }
    const [min, max] = start <= end ? [start, end] : [end, start];
    for (let page = min; page <= max; page += 1) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
};
