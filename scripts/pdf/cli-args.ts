import readline from "readline";
import { allVariants } from "../../lib/allVariants";
import { getDefaultResume } from "../../lib/getDefaultResume";

export interface CliArgs {
  resumePath: string;
  isAnon: boolean;
  skipPdf: boolean;
  resumeType: string;
  printOptions: Array<"resume" | "cover">;
}

async function promptForResumeType(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log("Please select a resume type:");
    allVariants.forEach((variant, idx) => {
      console.log(`  [${idx + 1}] ${variant}`);
    });
    rl.question("Enter the number of your choice: ", (answer) => {
      const idx = parseInt(answer, 10) - 1;
      rl.close();
      if (idx >= 0 && idx < allVariants.length) {
        resolve(allVariants[idx]);
      } else {
        console.error("❌ Invalid selection.");
        process.exit(1);
      }
    });
  });
}

export async function parseCliArgs(): Promise<CliArgs> {
  const userArgv = process.argv.slice(2);
  const isAnon = userArgv.includes("--anon");
  const skipPdf = userArgv.includes("--no-pdf");

  const resumeTypeArg = userArgv.find((arg) => arg.startsWith("--resumeType="));
  const resumePathArg = userArgv.find((arg) => arg.startsWith("--resumePath="));

  let resumeType: string;
  if (resumeTypeArg) {
    resumeType = resumeTypeArg.split("=")[1];
  } else {
    resumeType = await promptForResumeType();
  }

  if (!allVariants.includes(resumeType)) {
    console.error(
      `❌ Invalid resumeType: '${resumeType}'. Valid options: ${allVariants.join(", ")}`,
    );
    process.exit(1);
  }

  let resumePath: string;
  if (resumePathArg) {
    resumePath = resumePathArg.split("=")[1];
  } else {
    const defaultResume = getDefaultResume();
    resumePath = defaultResume.path.replace(/\/data\.yml$/, "");
    console.log(`📁 Using default resume: ${defaultResume.path}`);
  }

  const printArg = userArgv.find((arg) => arg.startsWith("--print="));
  let printOptions: Array<"resume" | "cover"> = ["resume", "cover"];
  if (printArg) {
    const val = printArg.split("=")[1].toLowerCase();
    printOptions = val
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v === "resume" || v === "cover") as Array<
      "resume" | "cover"
    >;
    if (printOptions.length === 0) printOptions = ["resume", "cover"];
  }

  return {
    resumePath,
    isAnon,
    skipPdf,
    resumeType,
    printOptions,
  };
}
