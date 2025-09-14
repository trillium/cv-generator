#!/usr/bin/env node

// Test the file listing functionality
async function testFileListing() {
  try {
    console.log("Testing file listing...");

    // Test the API endpoint directly
    const response = await fetch("http://localhost:4444/api/fs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing file listing:", error);
  }
}

testFileListing();
