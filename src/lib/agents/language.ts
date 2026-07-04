export const AGENT_ENGLISH_RESPONSE_RULE =
  "Language: Always respond in English, even if the user writes in another language.";

const ENGLISH_RULE_MARKER = "Always respond in English";

export function ensureEnglishResponseRule(instructions: string): string {
  if (instructions.includes(ENGLISH_RULE_MARKER)) {
    return instructions;
  }

  return `${instructions.trim()}\n\n${AGENT_ENGLISH_RESPONSE_RULE}`;
}
