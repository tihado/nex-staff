const TRAILING_SLASH_PATTERN = /\/$/;

export function normalizeAppUrl(url: string): string {
  const trimmed = url.replace(TRAILING_SLASH_PATTERN, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getVercelAppUrl(): string | undefined {
  const hostname =
    process.env.VERCEL_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!hostname) {
    return;
  }

  return normalizeAppUrl(hostname);
}

export function getAuthBaseUrl(): string {
  const explicitUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

  if (explicitUrl) {
    return normalizeAppUrl(explicitUrl);
  }

  return getVercelAppUrl() ?? "http://localhost:3000";
}

export function getPublicAuthBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return normalizeAppUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
  }

  if (process.env.BETTER_AUTH_URL) {
    return normalizeAppUrl(process.env.BETTER_AUTH_URL);
  }

  return getVercelAppUrl() ?? "http://localhost:3000";
}
