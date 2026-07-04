import Link from "next/link";
import { WorkplaceAudioDebugPanel } from "@/components/workplace/workplace-audio-debug-panel";
import { WorkplaceAudioProvider } from "@/components/workplace/workplace-audio-provider";

export default function WorkplaceAudioDevPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-scene p-6">
        <p className="font-[family-name:var(--font-body)] text-ink">
          Audio test page is only available in development.
        </p>
      </main>
    );
  }

  return (
    <WorkplaceAudioProvider>
      <main className="min-h-screen bg-bg-scene">
        <header className="border-wood border-b-[3px] bg-panel px-4 py-3">
          <Link
            className="font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase underline"
            href="/workplace"
          >
            ← Back to workplace
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-pixel)] text-[12px] text-ink uppercase tracking-wide">
            Workplace audio test lab
          </h1>
          <p className="mt-1 max-w-xl font-[family-name:var(--font-body)] text-[14px] text-ink-muted">
            Giả lập các case âm thanh khớp animation: bước chân, landing, vocal
            emote, pantry arrival, polyphony cap.
          </p>
        </header>
        <WorkplaceAudioDebugPanel variant="page" />
      </main>
    </WorkplaceAudioProvider>
  );
}
