import JSZip from "jszip";

/**
 * Stamp a watermark on every slide of a PPTX buffer (pure JS, serverless-safe).
 *
 * Adds two text shapes to each slide via the OOXML XML inside ppt/slides/*.xml:
 *   - a large diagonal centered watermark with the uploader name
 *   - a small "Uploaded by … · diunotes.com" header in the top-left
 *
 * Returns { buffer, pageCount }.
 */
export async function watermarkPptxBuffer(buffer, { uploaderName, siteUrl = "diunotes.com" }) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter(
    (n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n)
  );

  const safeName = escapeXml(uploaderName || "diunotes");
  const safeSite = escapeXml(siteUrl);
  const headerText = `Uploaded by: ${safeName}  ·  www.${safeSite}`;

  for (const path of slideFiles) {
    const file = zip.file(path);
    if (!file) continue;
    const xml = await file.async("string");
    const stamped = injectWatermark(xml, safeName, headerText);
    zip.file(path, stamped);
  }

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { buffer: out, pageCount: slideFiles.length };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Insert two <p:sp> shapes just before </p:spTree> on each slide.
 * EMU units: 914400 EMU = 1 inch. A standard 16:9 slide is 12192000 x 6858000 EMU.
 */
function injectWatermark(xml, name, header) {
  const closingTree = "</p:spTree>";
  const idx = xml.lastIndexOf(closingTree);
  if (idx === -1) return xml;

  // Big diagonal watermark, centered, semi-transparent gray.
  const big = `
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="9991" name="Watermark"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm rot="-2700000">
      <a:off x="1000000" y="2400000"/>
      <a:ext cx="10000000" cy="2000000"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="none" anchor="ctr" anchorCtr="1"/>
    <a:lstStyle/>
    <a:p>
      <a:pPr algn="ctr"/>
      <a:r>
        <a:rPr lang="en-US" sz="9600" b="1">
          <a:solidFill><a:srgbClr val="8A8A99"><a:alpha val="18000"/></a:srgbClr></a:solidFill>
          <a:latin typeface="Arial"/>
        </a:rPr>
        <a:t>${name}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>`;

  // Top-left header line.
  const top = `
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="9992" name="WatermarkHeader"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="200000" y="120000"/>
      <a:ext cx="11000000" cy="350000"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="none" anchor="t"/>
    <a:lstStyle/>
    <a:p>
      <a:pPr algn="l"/>
      <a:r>
        <a:rPr lang="en-US" sz="1100" b="1">
          <a:solidFill><a:srgbClr val="4566A6"/></a:solidFill>
          <a:latin typeface="Arial"/>
        </a:rPr>
        <a:t>${header}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>`;

  return xml.slice(0, idx) + big + top + xml.slice(idx);
}