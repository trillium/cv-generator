import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function countPdfPages(pdfBuffer: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}

export async function extractLastPageText(pdfBuffer: Buffer): Promise<{
  text: string;
  lineBreaks: number;
  lines: string[];
}> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;

  if (pageCount === 0) {
    return { text: "", lineBreaks: 0, lines: [] };
  }

  const lastPage = await pdfDoc.getPage(pageCount);
  const textContent = await lastPage.getTextContent();

  interface TextItem {
    str: string;
    transform: number[];
  }

  const lineMap = new Map<number, string[]>();

  for (const item of textContent.items) {
    if (!("str" in item)) continue;

    const textItem = item as TextItem;
    const y = Math.round(textItem.transform[5] * 10) / 10;

    if (!lineMap.has(y)) {
      lineMap.set(y, []);
    }
    lineMap.get(y)!.push(textItem.str);
  }

  const lines = Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, chars]) => chars.join(""));

  const text = lines.join("\n");
  const lineBreaks = lines.length - 1;

  return { text, lineBreaks, lines };
}
