export interface DocumentManifest {
  filename: string;
  path: string;
}

export interface StaffSandboxHandle {
  defaultWorkingDirectory: string;
  manifest: DocumentManifest[];
  sessionId: string;
}

export interface SandboxRunResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export interface SandboxSessionAdapter {
  destroy(): Promise<void>;
  readTextFile(path: string): Promise<string | null>;
  run(command: string, workingDirectory?: string): Promise<SandboxRunResult>;
  writeTextFile(path: string, content: string): Promise<void>;
}
