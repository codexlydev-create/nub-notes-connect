import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use a CDN worker that matches the installed pdfjs-dist version. This avoids
// having to copy the worker into /public and is the recommended setup for
// react-pdf v9+.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
        >
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <div key={i} className="flex justify-center py-3 border-b border-border last:border-b-0">
              <Page
                pageNumber={i + 1}
                width={width - 16}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="py-10 text-xs text-muted-foreground inline-flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Page {i + 1}…
                  </div>
                }
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}