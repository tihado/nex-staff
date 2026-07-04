"use client";

import { useState } from "react";
import { PixelButton } from "@/components/pixel";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    try {
      await authClient.signOut();
    } catch {
      /* proceed to login even if the API call fails */
    }

    window.location.assign("/login");
  }

  return (
    <PixelButton disabled={isLoading} onClick={handleSignOut}>
      {isLoading ? "..." : "Sign out"}
    </PixelButton>
  );
}
