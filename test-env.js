import { config } from "dotenv";

// Load environment variables
config();

console.log("PII_PATH from env:", process.env.PII_PATH);
console.log("Current working directory:", process.cwd());
console.log(".env file exists:", require("fs").existsSync(".env"));

if (require("fs").existsSync(".env")) {
  const envContent = require("fs").readFileSync(".env", "utf8");
  console.log(".env contents:");
  console.log(envContent);
}
