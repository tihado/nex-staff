"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

export function EmailPasswordForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "User",
          callbackURL: callbackUrl,
        });

        if (signUpError) {
          setError(signUpError.message ?? "Failed to create account");
          return;
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: callbackUrl,
        });

        if (signInError) {
          setError(signInError.message ?? "Invalid email or password");
          return;
        }
      }

      window.location.assign(callbackUrl);
      return;
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  let submitLabel = "Sign in";
  if (isLoading) {
    submitLabel = "Please wait...";
  } else if (mode === "sign-up") {
    submitLabel = "Create account";
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <div className="space-y-2">
            <label
              className="font-medium text-sm text-zinc-700 dark:text-zinc-300"
              htmlFor="name"
            >
              Name
            </label>
            <input
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-zinc-400 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              id="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              type="text"
              value={name}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="font-medium text-sm text-zinc-700 dark:text-zinc-300"
            htmlFor="email"
          >
            Email
          </label>
          <input
            autoComplete="email"
            className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-zinc-400 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label
            className="font-medium text-sm text-zinc-700 dark:text-zinc-300"
            htmlFor="password"
          >
            Password
          </label>
          <input
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-zinc-400 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p className="text-center text-red-600 text-sm dark:text-red-400">
            {error}
          </p>
        ) : null}

        <button
          className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={isLoading}
          type="submit"
        >
          {submitLabel}
        </button>
      </form>

      <button
        className="text-center text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        type="button"
      >
        {mode === "sign-in"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
