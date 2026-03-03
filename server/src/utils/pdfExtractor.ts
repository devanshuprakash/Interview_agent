import fs from "fs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — pdfjs-dist legacy build has no types
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extracts all text from a PDF at `filepath` and returns it collapsed to
 * single-spaced, trimmed text — byte-identical to the old controller logic.
 */
export async function extractPdfText(filepath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filepath);
  const uint8Array = new Uint8Array(fileBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  let resumeText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? "")
      .join(" ");
    resumeText += pageText + "\n";
  }

  return resumeText.replace(/\s+/g, " ").trim();
}
