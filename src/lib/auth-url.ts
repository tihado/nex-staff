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

export function getTrustedAuthOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "https://*.vercel.app",
  ]);

  const vercelUrl = getVercelAppUrl();
  if (vercelUrl) {
    origins.add(new URL(vercelUrl).origin);
  }

  for (const key of [
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_BETTER_AUTH_URL",
  ] as const) {
    const value = process.env[key];
    if (value) {
      origins.add(new URL(normalizeAppUrl(value)).origin);
    }
  }

  const extraOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extraOrigins) {
    for (const origin of extraOrigins.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  return [...origins];
}

export function getAuthBaseUrlConfig():
  | string
  | {
      allowedHosts: string[];
      fallback: string;
      protocol: "auto";
    } {
  if (process.env.VERCEL) {
    return {
      allowedHosts: ["localhost", "*.vercel.app"],
      fallback: getAuthBaseUrl(),
      protocol: "auto",
    };
  }

  return getAuthBaseUrl();
}
