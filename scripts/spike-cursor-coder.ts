import "dotenv/config";
import { Agent } from "@cursor/sdk";
import { resolveCoderRepoUrl } from "@/lib/github/resolve-coder-repo";
import { validateGitHubRepo } from "@/lib/github/validate-repo";

async function main(): Promise<void> {
  const repoUrl = resolveCoderRepoUrl();
  const validated = await validateGitHubRepo(repoUrl);

  console.log("Coder repo:", validated.repoUrl);
  console.log("Default branch:", validated.defaultBranch);

  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    console.log("CURSOR_API_KEY is not set. Skipping live Cursor agent run.");
    return;
  }

  await using agent = await Agent.create({
    apiKey,
    model: { id: "composer-2.5" },
    name: "Nex Staff coder spike",
    cloud: {
      repos: [
        {
          url: validated.repoUrl,
          startingRef: validated.defaultBranch,
        },
      ],
      autoCreatePR: true,
    },
  });

  const run = await agent.send(
    "Add a short note to README.md explaining this repo is managed by Nex Staff coder agents."
  );

  for await (const message of run.stream()) {
    if (message.type === "status" || message.type === "tool_call") {
      console.log(message.type, JSON.stringify(message));
    }
  }

  const result = await run.wait();
  console.log("Run status:", result.status);
  console.log("Summary:", result.result);
  console.log("Git:", JSON.stringify(result.git, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
