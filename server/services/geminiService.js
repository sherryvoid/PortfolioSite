const { GoogleGenerativeAI } = require('@google/generative-ai');
const Profile = require('../models/Profile');
const Skill = require('../models/Skill');

// Lazy initialization — reads the key at call-time, not at require-time.
// This guarantees dotenv has already loaded the .env file.
let _genAI = null;
function getGenAI() {
  if (!_genAI && process.env.GEMINI_API_KEY) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

/**
 * Analyzes a job listing against the user's profile and skills.
 * Returns matchScore (0-100) and a detailed markdown recommendation.
 */
exports.analyzeJobMatch = async (job) => {
  try {
    const genAI = getGenAI();
    if (!genAI) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to your server/.env file and restart the server.\n' +
        'Get a free key at: https://aistudio.google.com/app/apikey'
      );
    }

    const profile = await Profile.findOne();
    const skills = await Skill.find().sort({ proficiency: -1 });

    const userContext = `
User Name: ${profile?.name || 'Developer'}
Title: ${profile?.title || 'Software Developer'}
Bio: ${profile?.bio || 'N/A'}
Location: ${profile?.location || 'N/A'}

Skills:
${skills.map(s => `- ${s.name} (Proficiency: ${s.proficiency}/100, Category: ${s.category})`).join('\n')}
    `.trim();

    const cleanJobDesc = job.description ? job.description.replace(/<[^>]*>?/gm, '') : 'No description provided';
    const truncatedDesc = cleanJobDesc.substring(0, 4000);

    const prompt = `
You are an expert career coach and tech recruiter. Analyze how well a candidate matches a job and give a comprehensive, actionable strategy.

===== CANDIDATE PROFILE =====
${userContext}

===== JOB LISTING =====
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Work Mode: ${job.workMode || 'Unknown'}
Type: ${job.jobType}
Description:
${truncatedDesc}

===== INSTRUCTIONS =====
Respond STRICTLY in the following format. Use Markdown. Be specific, use real keywords from the job description.

LINE 1: A single integer between 0 and 100 representing the match percentage. NOTHING else on this line.

## 📊 Current Score Breakdown
Rate the candidate out of 10 in each of these categories, presented as a table:
| Category | Score | Notes |
|---|---|---|
| Technical Skills Match | X/10 | ... |
| Experience Level Fit | X/10 | ... |
| Domain Knowledge | X/10 | ... |
| Location/Availability Fit | X/10 | ... |
| Overall Culture Fit | X/10 | ... |

## ✅ What Your CV MUST Have Before Applying
A numbered list of the minimum required CV elements. If any of these are missing, the application will likely fail. Be brutally honest.

## 🔧 Specific CV Amendments
Actionable bullet points: what to reword, add, or restructure on the CV to optimize for THIS specific role. Give concrete before/after examples where possible.

## 💡 Skills to Highlight
Which of the candidate's current skills align perfectly and should be prominently featured.

## ⚠️ Gaps to Address
What the job requires that the candidate lacks. For each gap, give a 1-sentence strategy on how to handle it (e.g., "take this free course", "frame X experience as Y").

## 🎯 Interview Preparation Tips
2-3 likely interview questions for this specific role and company, with suggested answer angles.
    `.trim();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const lines = responseText.trim().split('\n');
    let matchScore = 0;

    const firstLineNumber = parseInt(lines[0].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(firstLineNumber) && firstLineNumber >= 0 && firstLineNumber <= 100) {
      matchScore = firstLineNumber;
      lines.shift();
    } else {
      matchScore = 50;
    }

    const recommendation = lines.join('\n').trim();

    return { matchScore, recommendation };

  } catch (error) {
    console.error('Job Analysis Service Error:', error.message);
    return {
      matchScore: 0,
      recommendation: `**⚠️ Failed to generate AI analysis.**\n\n**Reason:** ${error.message}\n\nPlease ensure your \`GEMINI_API_KEY\` is correctly configured in your server's .env file and restart the server.\n\nYou can get a free key at: https://aistudio.google.com/app/apikey`
    };
  }
};
