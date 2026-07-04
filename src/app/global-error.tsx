"use client";

import { useEffect } from "react";

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f5e6c8] p-6 text-center font-sans">
        <h1 className="font-bold text-lg uppercase tracking-widest">
          Something went wrong
        </h1>
        <p className="max-w-md text-base text-neutral-700">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          className="border-2 border-neutral-800 bg-white px-4 py-2 font-bold uppercase tracking-wide"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
