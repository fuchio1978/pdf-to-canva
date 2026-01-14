import { spawn } from "node:child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export const runCommand = (
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): Promise<CommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => resolve({ stdout, stderr, exitCode }));
  });
