require('dotenv').config();
const mongoose = require('mongoose');
const geminiService = require('./services/geminiService');
const JobListing = require('./models/JobListing');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    
    // Find the first job in the database
    const job = await JobListing.findOne();
    if (!job) {
      console.log('No jobs found in the database. Please sync some jobs in the dashboard first.');
      process.exit(0);
    }
    
    console.log(`Analyzing job: ${job.title} at ${job.company}...`);
    console.log('Calling Google Gemini API...');
    
    const result = await geminiService.analyzeJobMatch(job);
    
    console.log('\n========= RESULTS =========\n');
    console.log(`Match Score: ${result.matchScore}%\n`);
    console.log('AI Recommendation Strategy:\n');
    console.log(result.recommendation);
    console.log('\n===========================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

test();
