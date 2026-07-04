import { Suspense } from "react";
import { EmailPasswordForm } from "@/components/auth/email-password-form";
import { PixelIcon } from "@/components/pixel";
import {
  PixelBush,
  PixelCastle,
  PixelCloud,
  PixelGround,
  PixelGuard,
  PixelRainbow,
  PixelSun,
  PixelTree,
} from "@/components/workplace/pixel-scenery";

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--color-sky-top) 0%, var(--color-sky-mid) 55%, var(--color-sky-low) 100%)",
      }}
    >
      {/* Lively pixel scenery behind the login card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
      >
        <PixelSun
          className="pixel-sun-spin absolute top-8 right-10"
          size={72}
        />
        <PixelCloud className="absolute top-10 left-6" size={120} />
        <PixelCloud className="absolute top-28 left-1/4" size={84} />
        <PixelCloud className="absolute top-14 right-1/5" size={104} />
        <PixelRainbow
          className="absolute top-16 left-1/2 -translate-x-1/2"
          size={340}
        />
        <PixelCastle
          className="absolute bottom-[84px] left-1/2 -translate-x-1/2"
          size={200}
        />
        <PixelTree className="absolute bottom-[84px] left-6" size={100} />
        <PixelTree className="absolute right-8 bottom-[84px]" size={116} />
        <PixelBush className="absolute bottom-[84px] left-1/4" size={54} />
        <PixelBush className="absolute right-1/4 bottom-[84px]" size={48} />
        <PixelGround className="absolute inset-x-0 bottom-0" height={104} />
      </div>

      <main className="relative z-10 w-full max-w-md border-[4px] border-wood bg-panel shadow-[6px_6px_0_0_rgba(122,74,36,0.4)]">
        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 border-wood border-b-[4px] bg-leaf px-3 py-2 text-panel">
          <span className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-widest">
            <PixelIcon name="android" size={14} /> Nex Staff
          </span>
          <span aria-hidden className="flex gap-1">
            <span className="h-2 w-2 bg-panel" />
            <span className="h-2 w-2 bg-panel" />
            <span className="h-2 w-2 bg-panel" />
          </span>
        </div>

        <div className="p-6">
          {/* Gatekeeper chat intro */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center border-[3px] border-wood bg-sky-low">
              <PixelGuard size={52} />
            </div>
            <div className="relative flex-1 border-[3px] border-wood bg-white px-3 py-2">
              <span className="absolute top-4 -left-[9px] h-0 w-0 border-t-[6px] border-t-transparent border-r-[9px] border-r-wood border-b-[6px] border-b-transparent" />
              <p className="font-pixel text-[9px] text-leaf-dark uppercase tracking-widest">
                Gatekeeper
              </p>
              <p className="mt-1 font-body text-[20px] text-ink leading-tight">
                Hello boss! You need to authorize to enter your kingdom.
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="h-40 w-full animate-pulse border-[3px] border-wood border-dashed" />
            }
          >
            <EmailPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
