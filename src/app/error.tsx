"use client";

import { useEffect } from "react";
import { PixelButton } from "@/components/pixel";
import { uiStrings } from "@/lib/i18n/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 text-center">
      <h1 className="font-[family-name:var(--font-pixel)] text-[12px] text-ink uppercase tracking-widest">
        {uiStrings.somethingWentWrong}
      </h1>
      <p className="max-w-md font-body text-[20px] text-ink-muted leading-snug">
        {error.message || "An unexpected error occurred."}
      </p>
      <PixelButton onClick={reset} type="button">
        {uiStrings.retry}
      </PixelButton>
    </main>
  );
}
