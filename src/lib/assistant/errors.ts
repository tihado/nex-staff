import { APICallError } from "ai";

const RATE_LIMIT_MESSAGE =
  "The Assistant is receiving too many requests. Please wait a moment and try again.";

const GENERIC_STREAM_MESSAGE =
  "Something went wrong while generating a response. Please try again.";

const GENERIC_TOOL_MESSAGE =
  "This tool failed to run. Please try again or continue without it.";

export function logAssistantError(scope: string, error: unknown): void {
  if (APICallError.isInstance(error)) {
    console.error(`[assistant:${scope}]`, {
      message: error.message,
      name: error.name,
      statusCode: error.statusCode,
      url: error.url,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[assistant:${scope}]`, error.message);
    return;
  }

  console.error(`[assistant:${scope}]`, error);
}

export function getStreamErrorMessage(error: unknown): string {
  logAssistantError("stream", error);

  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return RATE_LIMIT_MESSAGE;
  }

  return GENERIC_STREAM_MESSAGE;
}

export function getToolErrorMessage(error: unknown): string {
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return RATE_LIMIT_MESSAGE;
  }

  return GENERIC_TOOL_MESSAGE;
}

export async function runToolSafely<T>(
  toolName: string,
  run: () => Promise<T>
): Promise<T | { error: string }> {
  try {
    return await run();
  } catch (error) {
    logAssistantError(`tool:${toolName}`, error);
    return { error: getToolErrorMessage(error) };
  }
}
