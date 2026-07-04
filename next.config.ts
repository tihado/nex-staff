import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { getPublicAuthBaseUrl } from "./src/lib/auth-url";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL:
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? getPublicAuthBaseUrl(),
  },
  // Workflow step bundle imports @vercel/sandbox → @vercel/oidc (CJS).
  // Externalize so Turbopack doesn't inline dynamic require; keep as direct dep for resolution.
  serverExternalPackages: ["@vercel/oidc"],
};

export default withWorkflow(nextConfig);
