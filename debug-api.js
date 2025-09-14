#!/usr/bin/env node

const API_BASE_URL = "http://localhost:4444";

async function debugAPI() {
  console.log("🔍 Testing API endpoint:", `${API_BASE_URL}/api/fs`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/fs`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Raw API Response:");
      console.log(JSON.stringify(data, null, 2));

      console.log("\n🔍 Response structure analysis:");
      console.log("- Has allFiles:", "allFiles" in data);
      console.log("- Has files:", "files" in data);
      console.log("- Has totalFiles:", "totalFiles" in data);
      console.log("- All keys:", Object.keys(data));

      if (data.allFiles) {
        console.log("- allFiles length:", data.allFiles.length);
        console.log("- First few files:", data.allFiles.slice(0, 3));
      }
      if (data.files) {
        console.log("- files length:", data.files.length);
        console.log("- First few files:", data.files.slice(0, 3));
      }
    } else {
      const errorText = await response.text();
      console.log("❌ API Error:", errorText);
    }
  } catch (error) {
    console.log("❌ Network/Connection Error:", error.message);
    console.log("   Make sure the dev server is running on port 4444");
    console.log("   Run: pnpm dev");
  }
}

// Test the listAllResumeFiles function directly
async function testListFunction() {
  console.log("\n🧪 Testing listAllResumeFiles function directly...");

  try {
    // Import the function (this won't work in pure JS, but shows the intent)
    const { listAllResumeFiles } = await import("./lib/utility/fileManager.js");
    const result = await listAllResumeFiles();

    console.log("✅ Function result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("❌ Function test error:", error.message);
  }
}

debugAPI()
  .then(() => {
    console.log("\n✅ API debug complete");
  })
  .catch(console.error);
