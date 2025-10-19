import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function countPdfPages(pdfBuffer: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}

export async function extractLastPageText(pdfBuffer: Buffer): Promise<{
  text: string;
  lineBreaks: number;
}> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;

  if (pageCount === 0) {
    return { text: "", lineBreaks: 0 };
  }

  const lastPage = await pdfDoc.getPage(pageCount);
  const textContent = await lastPage.getTextContent();

  const text = textContent.items
    .map((item) => ("str" in item ? item.str : ""))
    .join("");

  const lineBreaks = (text.match(/\n/g) || []).length;

  return { text, lineBreaks };
}
