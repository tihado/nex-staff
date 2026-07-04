"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PixelButton } from "@/components/pixel";
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
    <PixelButton disabled={isLoading} onClick={handleSignOut}>
      {isLoading ? "..." : "Sign out"}
    </PixelButton>
  );
}
