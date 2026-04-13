require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

async function testMongo() {
  console.log('\n--- 🟡 Testing MongoDB ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected successfully to Atlas!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
  }
}

async function testGemini() {
  console.log('\n--- 🟡 Testing Gemini ---');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Reply with exactly the word "Test".');
    console.log('✅ Gemini Success:', result.response.text().trim());
  } catch (err) {
    console.error('❌ Gemini Error:', err.message);
  }
}

async function testGroq() {
  console.log('\n--- 🟡 Testing Groq ---');
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Reply with exactly the word "Test".' }] },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );
    console.log('✅ Groq Success:', response.data.choices[0].message.content.trim());
  } catch (err) {
    console.error('❌ Groq Error:', err.response ? err.response.data.error.message : err.message);
  }
}

async function testHF() {
  console.log('\n--- 🟡 Testing HuggingFace ---');
  try {
    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3',
      { inputs: 'Reply with exactly the word "Test".', parameters: { max_new_tokens: 10 } },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` }, timeout: 10000 }
    );
    console.log('✅ HF Success:', response.data[0].generated_text);
  } catch (err) {
    console.error('❌ HF Error:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

async function runTests() {
  await testMongo();
  await testGemini();
  await testGroq();
  await testHF();
  process.exit(0);
}
runTests();
