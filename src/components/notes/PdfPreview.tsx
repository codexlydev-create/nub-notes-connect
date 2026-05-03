import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use a CDN worker that matches the installed pdfjs-dist version. This avoids
// having to copy the worker into /public and is the recommended setup for
// react-pdf v9+.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function LazyPage({ pageNumber, width }: { pageNumber: number; width: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  // Estimated A4 aspect placeholder so the scrollbar reflects total length.
  const placeholderHeight = Math.round(width * 1.414);

  return (
    <div
      ref={ref}
      className="flex justify-center py-3 border-b border-border last:border-b-0"
      style={!visible ? { minHeight: placeholderHeight } : undefined}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="py-10 text-xs text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Page {pageNumber}…
            </div>
          }
        />
      ) : (
        <div className="text-xs text-muted-foreground inline-flex items-center gap-2 self-center">
          <Loader2 className="w-3 h-3 animate-spin" /> Page {pageNumber}
        </div>
      )}
    </div>
  );
}

export default function PdfPreview({
  src,
  onPageCount,
}: {
  src: string;
  onPageCount?: (n: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(Math.floor(w));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Cap render width on mobile to avoid OOM crashes on giant PDFs.
  const renderWidth = Math.max(280, Math.min(width - 16, 900));

  return (
    <div ref={containerRef} className="w-full bg-muted/20">
      {error ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
          Couldn't load this PDF in the in-app preview.
          <div className="mt-2">
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Open in a new tab instead
            </a>
          </div>
        </div>
      ) : (
        <Document
          file={src}
          loading={
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading PDF…
            </div>
          }
          onLoadSuccess={(pdf) => {
            setNumPages(pdf.numPages);
            onPageCount?.(pdf.numPages);
          }}
          onLoadError={(err) => {
            console.error("PDF load error", err);
            setError(err?.message || "Failed to load PDF");
          }}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
            disableAutoFetch: true,
            disableStream: false,
          }}
        >
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <LazyPage key={i} pageNumber={i + 1} width={renderWidth} />
          ))}
          {numPages && numPages > 0 ? (
            <div className="p-4 text-center">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Open full PDF in a new tab
              </a>
            </div>
          ) : null}
        </Document>
      )}
    </div>
  );
}