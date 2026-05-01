import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

/**
 * Stamp a diagonal watermark on every page of a PDF buffer.
 * Returns a new PDF buffer with { uploaderName · siteUrl } repeated diagonally.
 */
export async function watermarkPdfBuffer(buffer, { uploaderName, siteUrl = "diunotes.com" }) {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const text = `${uploaderName || "diunotes"}`;
  const sub = siteUrl;

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    // big diagonal main watermark in the center
    const fontSize = Math.min(width, height) * 0.12;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const subSize = fontSize * 0.42;
    const subWidth = font.widthOfTextAtSize(sub, subSize);

    // center coordinates
    const cx = width / 2;
    const cy = height / 2;
    const angle = -30;

    // Draw main text rotated around center
    page.drawText(text, {
      x: cx - textWidth / 2,
      y: cy,
      size: fontSize,
      font,
      color: rgb(0.55, 0.55, 0.6),
      opacity: 0.18,
      rotate: degrees(angle),
    });
    // Subtitle
    page.drawText(sub, {
      x: cx - subWidth / 2,
      y: cy - fontSize * 0.6,
      size: subSize,
      font,
      color: rgb(0.55, 0.55, 0.6),
      opacity: 0.18,
      rotate: degrees(angle),
    });

    // Tiled lighter watermarks across the page for stronger protection
    const tileSize = fontSize * 0.5;
    const tileWidth = font.widthOfTextAtSize(text, tileSize);
    const stepX = tileWidth + 120;
    const stepY = tileSize + 140;
    for (let y = -stepY; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        page.drawText(text, {
          x, y,
          size: tileSize,
          font,
          color: rgb(0.6, 0.6, 0.65),
          opacity: 0.07,
          rotate: degrees(angle),
        });
      }
    }

    // Top-left "Uploaded by" header
    const headerSize = Math.max(10, Math.min(14, width * 0.018));
    page.drawText(`Uploaded by: ${uploaderName || ""}`, {
      x: 24,
      y: height - 24,
      size: headerSize,
      font,
      color: rgb(0.27, 0.4, 0.65),
      opacity: 0.85,
    });
    page.drawText(`To get more notes visit: www.${siteUrl}`, {
      x: 24,
      y: height - 24 - headerSize - 4,
      size: headerSize * 0.8,
      font,
      color: rgb(0.45, 0.5, 0.6),
      opacity: 0.8,
    });
  }

  const out = await pdfDoc.save({ useObjectStreams: false });
  return { buffer: Buffer.from(out), pageCount: pages.length };
}