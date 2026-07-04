import type { StaffConfig, StaffRuntimeProvider } from "@/db/schema";

export function getStaffRuntimeProvider(
  config: StaffConfig | null | undefined,
  useSandbox: boolean
): StaffRuntimeProvider {
  if (config?.runtimeProvider) {
    return config.runtimeProvider;
  }

  return useSandbox ? "vercel_sandbox" : "vercel_sandbox";
}

export function isCursorCloudStaff(
  config: StaffConfig | null | undefined,
  useSandbox: boolean
): boolean {
  return getStaffRuntimeProvider(config, useSandbox) === "cursor_cloud";
}

export function getStaffGithubConfig(
  config: StaffConfig | null | undefined
): StaffConfig["github"] | undefined {
  return config?.github;
}
