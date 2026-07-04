import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerViewer } from "@/lib/viewer";

export default async function HomePage() {
  const viewer = await getServerViewer();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-medium text-sm text-zinc-500 uppercase tracking-[0.2em]">
              Nex Staff
            </p>
            <h1 className="font-semibold text-3xl text-zinc-900 dark:text-zinc-50">
              Foundation ready
            </h1>
            <p className="text-zinc-600 leading-7 dark:text-zinc-400">
              You are signed in as{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {viewer?.name ?? viewer?.email}
              </span>
              . Your Assistant profile is provisioned and the workplace UI will
              land in upcoming issues.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">User ID</dt>
                <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {viewer?.id}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Assistant ID</dt>
                <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {viewer?.assistantId}
                </dd>
              </div>
            </dl>
          </div>

          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
