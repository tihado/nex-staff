"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
      disabled={isLoading}
      onClick={handleSignOut}
      type="button"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
