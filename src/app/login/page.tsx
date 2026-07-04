import { Suspense } from "react";
import { EmailPasswordForm } from "@/components/auth/email-password-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 space-y-2 text-center">
          <p className="font-medium text-sm text-zinc-500 uppercase tracking-[0.2em]">
            Nex Staff
          </p>
          <h1 className="font-semibold text-3xl text-zinc-900 dark:text-zinc-50">
            Sign in to continue
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use your email and password to access your workplace and Assistant.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-40 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          }
        >
          <EmailPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
