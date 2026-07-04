export const uiStrings = {
  close: "Close",
  retry: "Retry",
  ok: "OK",
  questComplete: "Quest complete",
  newHire: "New hire",
  somethingWentWrong: "Something went wrong",
  loadingWorkspace: "Loading workspace…",
  notNeeded: "Not needed",
  errors: {
    dismissNotification: "Could not dismiss notification. Please try again.",
    loadDeliverable: "Could not load deliverable. Please try again.",
    noDeliverable: "This task has no deliverable to preview yet.",
    refreshTasks: "Could not refresh tasks. Please try again.",
    reloadWorkspace: "Could not reload workspace. Please try again.",
    saveResponse: "Could not save your response. Please try again.",
  },
  taskBoard: {
    close: "Close task board",
    empty:
      "No active tasks. Delegate work from the Assistant to see progress here.",
    failedSection: "Failed tasks",
    loading: "Loading active tasks…",
    title: "Task Board",
  },
  deliverable: {
    closePreview: "Close deliverable preview",
    copied: "Copied!",
    copy: "Copy",
    copyFailed: "Copy failed",
    download: "Download .md",
    title: "Deliverable",
  },
  dialogue: {
    advance: "▼ Continue",
    continue: "Continue",
  },
  archive: {
    description:
      "Document library — each file is a volume on the shelf, ready to assign to staff.",
  },
  workplace: {
    bannerCompleted: (staffName: string, title: string) =>
      `✨ ${staffName} completed: ${title}`,
    bannerFailed: (staffName: string, title: string) =>
      `⚠ ${staffName} failed: ${title}`,
    hireJoined: (name: string) => `✨ ${name} joined the team!`,
    activeTasksGreeting: (count: number, baseGreeting: string) => {
      const taskLabel = count === 1 ? "1 task" : `${count} tasks`;
      return `${taskLabel} in progress — your team is working in the background. You can hire more staff, delegate new work, or ask about anything else.\n\n${baseGreeting}`;
    },
    pendingCompletionGreeting: (
      staffName: string,
      title: string,
      baseGreeting: string
    ) =>
      `${staffName} just finished "${title}". Want to see the result?\n\n${baseGreeting}`,
    emptyDeskGreeting:
      "This desk is open. Tell me who to hire and what they should work on — I'll handle the rest.",
  },
  staffStatus: {
    checkpoints: "Checkpoints",
    close: "Close staff status",
    idle: "No active task right now. Chat with the Assistant to delegate work.",
    loading: "Loading task status…",
    noOutput: "No output yet. Check back once the task finishes.",
    offline: "This agent is currently offline.",
    output: "Output",
    progress: "Progress",
    refresh: "Refresh",
    starting: "Starting…",
    talkToAssistant: "Talk to Assistant",
    title: "Agent status",
  },
  completion: {
    greeting: (staffName: string, title: string) =>
      `${staffName} just finished "${title}"!`,
    viewResult: "View result",
    delegateMore: "Delegate more",
    close: "Close",
  },
  hire: {
    writerExplain:
      "Content Writers draft blogs, long-form content, and match tone to your brief. They use a sandbox to produce deliverable files.",
    proposeDesk:
      "Want to hire a Content Writer for this desk? They'll write blogs and long-form content in the tone you choose.",
    taskPropose: (name: string, taskSummary: string) =>
      `No Writer on the team yet — hire ${name} to ${taskSummary}?`,
    yesHireWriter: "Yes, hire Content Writer",
    yesHireName: (name: string) => `Yes, hire ${name}`,
    notNow: "Not now",
    explainMore: "Tell me more",
    gatherName: "What should we call this staff member? (e.g. Alex)",
    gatherTone: (name: string) =>
      `What writing tone should ${name || "they"} use?`,
    gatherDocs: "Any reference documents to link?",
    confirmHire: (name: string, tone: string) =>
      `Confirm hiring ${name} (Content Writer) with a ${tone} tone?`,
    confirmHireLabel: (name: string) => `Confirm hire ${name} (Content Writer)`,
    confirmHireGeneric: "Confirm hire Content Writer",
    edit: "Edit details",
    staffLimit:
      "Can't hire more staff. You've reached the maximum roster size.",
    celebrateAtDesk: (name: string) => `${name} is ready at their desk! ✨`,
    staffJoined: "Staff joined the team!",
    delegateOffer: (name: string, taskSummary: string) =>
      `${name} is ready! Delegate ${taskSummary} now?`,
    delegateNow: "Delegate now",
    delegateLater: "Later",
    delegatePrompt: "Delegate now?",
    continue: "Continue",
    thisTask: "this task",
  },
} as const;
