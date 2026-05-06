import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

/**
 * Convert a PPTX/PPT buffer to a PDF buffer using LibreOffice headless.
 * Requires `libreoffice` (or `soffice`) to be installed on the host.
 */
export async function convertPptxBufferToPdf(buffer) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pptx2pdf-"));
  const inputPath = path.join(tmpDir, `in-${crypto.randomBytes(4).toString("hex")}.pptx`);
  await fs.writeFile(inputPath, buffer);

  const bin = process.env.LIBREOFFICE_BIN || "soffice";
  await new Promise((resolve, reject) => {
    const child = spawn(bin, [
      "--headless",
      "--norestore",
      "--nolockcheck",
      "--nodefault",
      "--convert-to", "pdf",
      "--outdir", tmpDir,
      inputPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`libreoffice exited with ${code}: ${stderr}`));
    });
  });

  const outPath = inputPath.replace(/\.pptx?$/i, ".pdf");
  const pdf = await fs.readFile(outPath);

  // Cleanup (best-effort).
  fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  return pdf;
}