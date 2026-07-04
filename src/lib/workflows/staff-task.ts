import { DurableAgent } from "@workflow/ai/agent";
import { google } from "@workflow/ai/google";
import type { StepResult, ToolSet, UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import {
  buildStaffInstructions,
  buildStaffTools,
} from "@/lib/agents/staff-tools";
import {
  createStaffSandbox,
  destroyStaffSandbox,
} from "@/lib/sandbox/create-staff-sandbox";
import { extractDeliverableFromSandbox } from "@/lib/sandbox/extract-deliverable";
import type { StaffSandboxHandle } from "@/lib/sandbox/types";
import { DEFAULT_STAFF_MODEL } from "@/lib/staff/constants";
import { DEFAULT_MAX_STEPS } from "@/lib/tasks/constants";
import {
  appendTaskPreview,
  createTaskCompletedNotification,
  getTaskForWorkflow,
  markTaskFailed,
  releaseStaffIfIdle,
  reportProgress,
  saveDeliverable,
  setStaffWorking,
} from "@/lib/tasks/service";
import type { ProgressInput } from "@/lib/tasks/types";

async function reportProgressStep(
  taskId: string,
  event: ProgressInput
): Promise<void> {
  "use step";
  await reportProgress(taskId, event);
}

async function loadTaskAndStaffStep(taskId: string) {
  "use step";
  return await getTaskForWorkflow(taskId);
}

async function setStaffWorkingStep(staffId: string): Promise<void> {
  "use step";
  await setStaffWorking(staffId);
}

async function releaseStaffIfIdleStep(staffId: string): Promise<void> {
  "use step";
  await releaseStaffIfIdle(staffId);
}

async function appendTaskPreviewStep(
  taskId: string,
  text: string
): Promise<void> {
  "use step";
  await appendTaskPreview(taskId, text);
}

async function saveDeliverableStep(
  taskId: string,
  content: string,
  brief: string
): Promise<string> {
  "use step";

  const title =
    brief.trim().split("\n")[0]?.slice(0, 120) || "Task deliverable";

  return await saveDeliverable(taskId, {
    title,
    content,
    contentType: "text/markdown",
  });
}

async function markTaskFailedStep(
  taskId: string,
  error: unknown
): Promise<void> {
  "use step";
  await markTaskFailed(taskId, error);
}

async function createTaskCompletedNotificationStep(
  taskId: string
): Promise<void> {
  "use step";
  await createTaskCompletedNotification(taskId);
}

function summarizeStep(step: StepResult<ToolSet>): string {
  const toolNames = step.toolCalls?.map((call) => call.toolName) ?? [];

  if (toolNames.length > 0) {
    return `Using: ${toolNames.join(", ")}`;
  }

  if (step.text) {
    const excerpt = step.text.trim().slice(0, 80);
    return excerpt.length > 0 ? excerpt : "Processing...";
  }

  return "Processing...";
}

export async function staffTaskWorkflow(taskId: string): Promise<void> {
  "use workflow";

  let sandboxHandle: StaffSandboxHandle | null = null;
  let staffId: string | null = null;

  try {
    await reportProgressStep(taskId, {
      type: "workflow.started",
      label: "Starting work",
      progressPercent: 0,
    });

    const { task, staff } = await loadTaskAndStaffStep(taskId);
    staffId = staff.id;

    await setStaffWorkingStep(staff.id);

    if (staff.useSandbox) {
      await reportProgressStep(taskId, {
        type: "sandbox.creating",
        label: "Preparing workspace...",
        progressPercent: 5,
      });

      const sandboxStartedAt = Date.now();
      sandboxHandle = await createStaffSandbox(staff, task);

      await reportProgressStep(taskId, {
        type: "sandbox.created",
        label: "Workspace ready",
        progressPercent: 10,
        payload: { durationMs: Date.now() - sandboxStartedAt },
      });
    }

    const modelId = staff.model ?? DEFAULT_STAFF_MODEL;
    const tools = buildStaffTools(staff, sandboxHandle?.sessionId);
    const agent = new DurableAgent({
      model: google(modelId),
      instructions: buildStaffInstructions(staff, sandboxHandle?.manifest),
      tools,
    });

    const maxSteps = DEFAULT_MAX_STEPS;
    let stepIndex = 0;

    const result = await agent.stream({
      messages: [{ role: "user", content: task.brief }],
      writable: getWritable<UIMessageChunk>(),
      maxSteps,
      onStepFinish: async (step: StepResult<ToolSet>) => {
        stepIndex += 1;

        await reportProgressStep(taskId, {
          type: "agent.step_started",
          label: `Step ${stepIndex}/${maxSteps}`,
          payload: { step: stepIndex, maxSteps },
        });

        for (const toolCall of step.toolCalls ?? []) {
          await reportProgressStep(taskId, {
            type: "agent.tool_called",
            label: toolCall.toolName,
            payload: {
              toolName: toolCall.toolName,
              toolCallId: toolCall.toolCallId,
            },
          });
        }

        if (step.text) {
          await reportProgressStep(taskId, {
            type: "agent.text_delta",
            label: "Writing draft...",
            payload: { length: step.text.length },
          });
          await appendTaskPreviewStep(taskId, step.text);
        }

        await reportProgressStep(taskId, {
          type: "agent.step_completed",
          label: summarizeStep(step),
          progressPercent: Math.min(
            95,
            Math.round((stepIndex / maxSteps) * 90) + 10
          ),
          payload: {
            step: stepIndex,
            toolNames: step.toolCalls?.map((call) => call.toolName) ?? [],
          },
        });
      },
    });

    const fallbackText =
      result.steps.at(-1)?.text ??
      result.messages
        .filter((message) => message.role === "assistant")
        .map((message) =>
          typeof message.content === "string" ? message.content : ""
        )
        .join("\n")
        .trim();

    const content = sandboxHandle
      ? await extractDeliverableFromSandbox(sandboxHandle.sessionId, taskId)
      : fallbackText;

    const deliverableId = await saveDeliverableStep(
      taskId,
      content,
      task.brief
    );

    await reportProgressStep(taskId, {
      type: "workflow.completed",
      label: "Complete",
      progressPercent: 100,
      payload: { deliverableId },
    });

    await createTaskCompletedNotificationStep(taskId);
  } catch (error) {
    await markTaskFailedStep(taskId, error);

    const message =
      error instanceof Error ? error.message : "Task execution failed.";

    await reportProgressStep(taskId, {
      type: "workflow.failed",
      label: message,
      progressPercent: 0,
      payload: { error: message },
    });

    throw error;
  } finally {
    if (sandboxHandle) {
      await destroyStaffSandbox(sandboxHandle.sessionId);
    }

    if (staffId) {
      await releaseStaffIfIdleStep(staffId);
    }
  }
}
