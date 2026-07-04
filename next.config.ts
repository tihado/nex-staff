import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { getPublicAuthBaseUrl } from "./src/lib/auth-url";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL:
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? getPublicAuthBaseUrl(),
  },
};

export default withWorkflow(nextConfig);
