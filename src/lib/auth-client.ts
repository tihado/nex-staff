import { createAuthClient } from "better-auth/react";
import { getPublicAuthBaseUrl } from "@/lib/auth-url";

function getAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return getPublicAuthBaseUrl();
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});
