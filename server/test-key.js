require('dotenv').config();
const axios = require('axios');

async function testKey() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Key is empty or missing in .env");

    console.log(`Found Key: ${key.substring(0, 8)}...${key.substring(key.length-4)}`);
    console.log("Connecting directly to Google API via Axios...");

    // Call the Gemini REST API directly to bypass any SDK crashes
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        contents: [
          {
            parts: [{ text: "Respond with exactly one word: 'SUCCESS'" }]
          }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const answer = response.data.candidates[0].content.parts[0].text.trim();
    console.log("Response:", answer);
    console.log("\n✅ The API Key is WORKING perfectly!");
    process.exit(0);
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.status, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Test Failed:\n", error.message);
    }
    process.exit(1);
  }
}

testKey();
