require('dotenv').config();
const axios = require('axios');

async function testModel(modelName) {
  try {
    const key = process.env.GEMINI_API_KEY;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
      { contents: [{ parts: [{ text: "Respond with exactly one word: 'SUCCESS'" }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log(`✅ ${modelName}:`, response.data.candidates[0].content.parts[0].text.trim());
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}:`, error.response ? `${error.response.status} ${error.response.statusText}` : error.message);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-1.5-pro',
    'gemini-2.5-pro',
    'gemini-3.1-flash',
    'gemini-3.1-pro',
    'gemini-2.5-flash',
    'gemini-pro',
    'gemini-1.5-flash-8b'
  ];
  
  for (const m of models) {
    if (await testModel(m)) break; // Found one that works
  }
  process.exit(0);
}

run();
