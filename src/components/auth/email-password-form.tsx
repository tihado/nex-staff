"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PixelButton } from "@/components/pixel";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

const INPUT_CLASS =
  "h-12 w-full border-[3px] border-wood bg-white px-3 font-body text-[20px] text-ink leading-none outline-none transition-colors focus:border-leaf";
const LABEL_CLASS =
  "block font-pixel text-[9px] text-ink uppercase tracking-widest";

export function EmailPasswordForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("ceo@nexstaff.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/workplace";

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
    <div className="flex w-full flex-col gap-5">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <div className="space-y-2">
            <label className={LABEL_CLASS} htmlFor="name">
              Name
            </label>
            <input
              autoComplete="name"
              className={INPUT_CLASS}
              id="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              type="text"
              value={name}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className={LABEL_CLASS} htmlFor="email">
            Email
          </label>
          <input
            autoComplete="email"
            className={INPUT_CLASS}
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS} htmlFor="password">
            Password
          </label>
          <input
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            className={INPUT_CLASS}
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            required
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p className="border-[3px] border-pixel-alert bg-pixel-alert/10 px-3 py-2 text-center font-body text-[18px] text-pixel-alert">
            {error}
          </p>
        ) : null}

        <PixelButton
          className="w-full justify-center py-3"
          disabled={isLoading}
          type="submit"
        >
          {submitLabel}
        </PixelButton>
      </form>

      <button
        className="font-pixel text-[9px] text-sky-accent uppercase tracking-widest hover:text-leaf-dark"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        type="button"
      >
        {mode === "sign-in"
          ? "> Need an account? Sign up"
          : "> Already have an account? Sign in"}
      </button>
    </div>
  );
}
