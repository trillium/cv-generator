import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import { config } from "dotenv";

config();

const execAsync = promisify(exec);

export async function killProcessOnPort(port: number): Promise<void> {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout
        .split("\n")
        .filter((line) => line.includes("LISTENING"));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(`🔥 Killed process ${pid} on port ${port}`);
        }
      }
    } else {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout
        .trim()
        .split("\n")
        .filter((pid) => pid);
      for (const pid of pids) {
        if (pid && !isNaN(Number(pid))) {
          await execAsync(`kill -9 ${pid}`);
          console.log(`🔥 Killed process ${pid} on port ${port}`);
        }
      }
    }
  } catch {
    console.log(`✅ No process found on port ${port}`);
  }
}

export async function startNextServer(rootDir: string, preferredPort?: number) {
  const defaultPort = process.env.PORT_DEV
    ? parseInt(process.env.PORT_DEV, 10)
    : 7542;
  const initialPort = preferredPort || defaultPort;

  await killProcessOnPort(initialPort);

  let port = initialPort;
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🚀 Attempting to start Next.js server on port ${port}...`);

      const nextProcess = spawn("pnpm", ["dev", "-p", port.toString()], {
        cwd: rootDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const result = await new Promise<{
        process: import("node:child_process").ChildProcess;
        url: string;
      }>((resolve, reject) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            nextProcess.kill();
            reject(
              new Error(
                `Next.js server failed to start on port ${port} within 30 seconds`,
              ),
            );
          }
        }, 30000);

        nextProcess.stdout?.on("data", (data) => {
          const output = data.toString();
          if (output.includes("Local:") || output.includes("Ready")) {
            console.log(output.trim());
          }
          if (output.includes("Ready") && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({
              process: nextProcess,
              url: `http://localhost:${port}`,
            });
          }
        });

        nextProcess.stderr?.on("data", (data) => {
          const errorOutput = data.toString();

          if (
            errorOutput.includes("Error") ||
            errorOutput.includes("EADDRINUSE")
          ) {
            console.error(errorOutput.trim());
          }

          if (
            errorOutput.includes("EADDRINUSE") ||
            errorOutput.includes("address already in use")
          ) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              nextProcess.kill();
              reject(new Error(`Port ${port} is already in use`));
            }
          }
        });

        nextProcess.on("error", (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(error);
          }
        });

        nextProcess.on("exit", (code) => {
          if (code !== 0 && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(`Next.js process exited with code ${code}`));
          }
        });
      });

      console.log(`✅ Successfully started Next.js server on port ${port}`);
      return result;
    } catch (error) {
      console.log(
        `❌ Failed to start server on port ${port}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      if (attempt === maxAttempts - 1) {
        console.error(
          `💥 Failed to start server after ${maxAttempts} attempts`,
        );
        console.error(
          `💡 Try manually stopping any processes using ports ${initialPort}-${port} and run again`,
        );
        process.exit(1);
      }

      port++;
      console.log(`🔄 Trying port ${port}...`);

      await killProcessOnPort(port);
    }
  }

  throw new Error(`Failed to start server after ${maxAttempts} attempts`);
}
