"use client";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

interface DocumentPdfScrollProps {
  blobUrl: string;
}

const PAGE_CANVAS_CLASS =
  "mx-auto mb-5 block max-w-full border border-[#C4A574]/70 bg-[#FFFCF5] shadow-[0_3px_10px_rgba(90,55,25,0.18)]";

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  return pdfjs;
}

async function fetchPdfData(blobUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(blobUrl);

  if (!response.ok) {
    throw new Error("Failed to load PDF scroll.");
  }

  return response.arrayBuffer();
}

async function renderPageToCanvas(
  page: PDFPageProxy,
  maxWidth: number
): Promise<HTMLCanvasElement | null> {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = window.document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.className = PAGE_CANVAS_CLASS;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

async function renderPdfPages(
  pdf: PDFDocumentProxy,
  container: HTMLDivElement,
  isCancelled: () => boolean
): Promise<void> {
  const maxWidth = Math.min(container.clientWidth || 520, 520);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (isCancelled()) {
      return;
    }

    const page = await pdf.getPage(pageNumber);
    const canvas = await renderPageToCanvas(page, maxWidth);

    if (canvas && !isCancelled()) {
      container.appendChild(canvas);
    }
  }
}

export function DocumentPdfScroll({ blobUrl }: DocumentPdfScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      setPageCount(0);
      container.replaceChildren();

      try {
        const pdfjs = await loadPdfJs();
        const data = await fetchPdfData(blobUrl);
        const pdf = await pdfjs.getDocument({ data }).promise;

        if (cancelled) {
          return;
        }

        setPageCount(pdf.numPages);
        await renderPdfPages(pdf, container, () => cancelled);
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Failed to render PDF scroll."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run().catch(() => {
      /* handled above */
    });

    return () => {
      cancelled = true;
    };
  }, [blobUrl]);

  const showPageCount = !(loading || error) && pageCount > 1;

  return (
    <div className="flex w-full flex-col items-center">
      {loading ? (
        <p className="text-center font-[family-name:var(--font-body)] text-[#5C4A2E] text-[20px]">
          Unrolling PDF scroll…
        </p>
      ) : null}

      {error ? (
        <p
          className="text-center font-[family-name:var(--font-body)] text-[20px] text-alert"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {showPageCount ? (
        <p className="mb-4 text-center font-[family-name:var(--font-body)] text-[#8A7048] text-[18px]">
          {pageCount} pages on this scroll
        </p>
      ) : null}

      <div className="w-full" ref={containerRef} />
    </div>
  );
}
