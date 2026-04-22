const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Profile = require('../models/Profile');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const Certification = require('../models/Certification');

function getGemini() {
  return process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
}

// ─── Build Rich User Context from ALL DB collections ─────────
async function buildUserContext() {
  const [profile, skills, projects, certs] = await Promise.all([
    Profile.findOne(), Skill.find().sort({ proficiency: -1 }),
    Project.find().sort({ order: 1 }), Certification.find().sort({ order: 1 })
  ]);
  const s = [];
  if (profile?.aiVector) {
    s.push(`=== MANUALLY GENERATED CONTEXT SNAPSHOT ===\n${profile.aiVector}\n==============================================\n`);
  }
  s.push(`Name: ${profile?.name || 'Developer'}`);
  s.push(`Title/Designation: ${profile?.title || 'Software Developer'}`);
  s.push(`Bio: ${profile?.bio || 'N/A'}`);
  s.push(`Location: ${profile?.location || 'N/A'}`);
  s.push(`Email: ${profile?.email || 'N/A'}`);
  if (profile?.aboutTimeline?.length) {
    s.push('\nTimeline & Work Experience:');
    profile.aboutTimeline.forEach(e => s.push(`- ${e.title} (${e.year}):\n${e.description}`));
  }
  if (profile?.education?.length) {
    s.push('\nEducation:');
    profile.education.forEach(e => s.push(`- ${e.degree} in ${e.field} from ${e.institution} (${e.year})`));
  }
  if (profile?.languages?.length) {
    s.push('\nLanguages:');
    profile.languages.forEach(l => s.push(`- ${l.name}: ${l.level}`));
  }
  if (skills.length) {
    s.push('\nTechnical Skills:');
    const grouped = {};
    skills.forEach(sk => { if (!grouped[sk.category]) grouped[sk.category] = []; grouped[sk.category].push(`${sk.name} (${sk.proficiency}/100)`); });
    Object.entries(grouped).forEach(([cat, items]) => s.push(`  ${cat}: ${items.join(', ')}`));
  }
  if (projects.length) {
    s.push('\nPortfolio Projects:');
    projects.forEach(p => s.push(`- ${p.title}: ${p.description} [Tech: ${(p.techStack || []).join(', ')}]`));
  }
  if (certs.length) {
    s.push('\nCertifications:');
    certs.forEach(c => s.push(`- ${c.title} by ${c.issuer}${c.issueDate ? ` (${new Date(c.issueDate).getFullYear()})` : ''}`));
  }
  if (profile?.preferredJobTypes?.length) s.push(`\nPreferred Job Types: ${profile.preferredJobTypes.join(', ')}`);
  if (profile?.preferredLocations?.length) s.push(`Preferred Locations: ${profile.preferredLocations.join(', ')}`);
  if (profile?.preferredWorkModes?.length) s.push(`Preferred Work Modes: ${profile.preferredWorkModes.join(', ')}`);
  return { text: s.join('\n'), profile, skills, projects, certs };
}

// ─── Gemini Provider ─────────────────────────────────────────
async function analyzeWithGemini(prompt) {
  const genAI = getGemini();
  if (!genAI) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  let retries = 3, delay = 2000;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 || error.status === 429 || error.message?.includes('503') || error.message?.includes('429')) {
        retries--;
        if (retries === 0) throw new Error('Gemini overloaded. Falling back.');
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      } else throw error;
    }
  }
}

// ─── HuggingFace Provider ────────────────────────────────────
async function analyzeWithHuggingFace(prompt) {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error('HUGGINGFACE_API_KEY not set');
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    { inputs: `<s>[INST] ${prompt} [/INST]`, parameters: { max_new_tokens: 3000, temperature: 0.3 } },
    { headers: { 'Authorization': `Bearer ${token}` }, timeout: 60000 }
  );
  const generated = response.data?.[0]?.generated_text || '';
  const parts = generated.split('[/INST]');
  return parts.length > 1 ? parts[parts.length - 1].trim() : generated.trim();
}

// ─── Groq Provider ───────────────────────────────────────────
async function analyzeWithGroq(prompt) {
  const token = process.env.GROQ_API_KEY;
  if (!token) throw new Error('GROQ_API_KEY not set');
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data?.choices?.[0]?.message?.content || '';
}

// ─── AI Call with Waterfall ──────────────────────────────────
async function callAI(prompt) {
  const providers = [
    { name: 'gemini', fn: () => analyzeWithGemini(prompt) },
    { name: 'groq', fn: () => analyzeWithGroq(prompt) },
    { name: 'huggingface', fn: () => analyzeWithHuggingFace(prompt) }
  ];
  for (const p of providers) {
    try {
      const text = await p.fn();
      if (text && text.length > 10) return { text, provider: p.name };
    } catch (err) {
      console.warn(`⚠️ ${p.name} failed: ${err.message}`);
    }
  }
  throw new Error('All AI providers (Gemini, Groq, HF) failed. Check API keys and quotas.');
}

// ─── Parse structured JSON from AI response ──────────────────
function extractJSON(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (match) {
    try { return JSON.parse((match[1] || match[0]).trim()); } catch (e) { /* skip */ }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// 1) ANALYZE JOB MATCH — No ATS (ATS comes after CV generation)
// ═══════════════════════════════════════════════════════════════
exports.analyzeJobMatch = async (job) => {
  try {
    const { text: userContext } = await buildUserContext();
    const cleanDesc = job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 5000) : 'No description';
    const langNote = job.language === 'german'
      ? `\nIMPORTANT: This job description is in GERMAN. Internally translate key requirements. Note German-language requirements as critical factors. Respond in ENGLISH.\n` : '';

    const prompt = `
You are an expert career coach and tech recruiter. Analyze how well a candidate matches a job.
${langNote}
===== CANDIDATE PROFILE =====
${userContext}

===== JOB LISTING =====
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Work Mode: ${job.workMode || 'Unknown'}
Type: ${job.jobType}
Language: ${job.language || 'english'}
Description:
${cleanDesc}

===== INSTRUCTIONS =====
1. Determine an honest Match Percentage (0-100). Do NOT output 0% just because a few skills are missing. Baseline on existing overlaps.
2. Provide a 2 paragraph clear Evaluation/Recommendation.
3. Include a explicit "Motivation Letter Strategy" paragraph: identify EXACTLY which of the candidate's existing projects/experiences they should mention in a cover letter, and HOW it relates to this job's core demands.

===== MACHINE-READABLE DATA =====
After your markdown evaluation, add EXACTLY this JSON block (ensure the markdown block uses \`\`\`json):
\`\`\`json
{
  "matchScore": <0-100>,
  "breakdown": { "technicalSkills": <0-10>, "experienceLevel": <0-10>, "domainKnowledge": <0-10>, "locationFit": <0-10>, "cultureFit": <0-10> },
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missingSkill1", "missingSkill2"]
}
\`\`\`
    `.trim();

    const { text: responseText, provider } = await callAI(prompt);
    
    const data = extractJSON(responseText) || { matchScore: 50, breakdown: {}, matchedSkills: [], missingSkills: [] };
    const recommendation = responseText.replace(/```json[\s\S]*?```/g, '').trim();
    let matchScore = data.matchScore || 50;

    return {
      matchScore, recommendation, provider,
      matchBreakdown: {
        technicalSkills: { score: data.breakdown?.technicalSkills || 0, notes: '' },
        experienceLevel: { score: data.breakdown?.experienceLevel || 0, notes: '' },
        domainKnowledge: { score: data.breakdown?.domainKnowledge || 0, notes: '' },
        locationFit: { score: data.breakdown?.locationFit || 0, notes: '' },
        cultureFit: { score: data.breakdown?.cultureFit || 0, notes: '' }
      },
      matchedSkills: data.matchedSkills || [],
      missingSkills: data.missingSkills || []
    };
  } catch (error) {
    console.error('AI Analysis Error:', error.message);
    return {
      matchScore: 0, provider: 'error',
      recommendation: `**⚠️ Analysis failed.**\n\n${error.message}\n\nEnsure API keys are set in .env.`,
      matchBreakdown: {}, matchedSkills: [], missingSkills: []
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// 2) GENERATE FOLLOW-UP EMAIL — Fully AI, human-like, with context
// ═══════════════════════════════════════════════════════════════
exports.generateFollowUpEmail = async (job) => {
  const { text: userContext, profile } = await buildUserContext();
  const daysSinceApplied = job.appliedAt ? Math.floor((Date.now() - new Date(job.appliedAt)) / 86400000) : 0;
  const matchedSkillsStr = (job.matchedSkills || []).join(', ');

  const prompt = `
You are writing a follow-up email on behalf of a real person. This must sound like a HUMAN wrote it — warm, genuine, conversational. NOT corporate-speak. No buzzwords. No "I hope this email finds you well."

WRITER'S IDENTITY:
Name: ${profile?.name || 'the candidate'}
Role: ${profile?.title || 'Software Developer'}
Email: ${profile?.email || ''}
Key Skills: ${matchedSkillsStr || 'Software Development'}

JOB CONTEXT:
Position: ${job.title} at ${job.company}
Applied: ${daysSinceApplied} days ago (${job.appliedAt ? new Date(job.appliedAt).toLocaleDateString('en-GB') : 'recently'})
This is follow-up #${(job.followUpCount || 0) + 1}.

${job.followUpCount > 0 ? 'This is a SECOND+ follow-up. Keep it very brief (3-4 sentences max). Be respectful of their time.' : 'This is the FIRST follow-up. Express genuine interest.'}

RULES:
- Subject line on first line as "Subject: ..."
- Max 120 words for body
- Reference the SPECIFIC position title and company
- Mention 1-2 specific skills relevant to the role (from the matched skills if available)
- ${job.followUpCount === 0 ? 'Ask if they need any additional materials or would like to schedule a call' : 'Simply check on the status and reaffirm interest'}
- Sign off with the writer's actual name: ${profile?.name || 'the candidate'}
- Sound like a real person, not a template. Use natural phrasing.
- DO NOT include placeholder brackets like [Your Name]

Write ONLY the email text.
  `.trim();

  try {
    const { text } = await callAI(prompt);
    const lines = text.trim().split('\n');
    let subject = `Following up — ${job.title} at ${job.company}`;
    let body = text.trim();
    if (lines[0].toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/^subject:\s*/i, '').trim();
      body = lines.slice(1).join('\n').trim();
    }
    return { subject, body };
  } catch (error) {
    const name = profile?.name || 'Your Name';
    return {
      subject: `Following up — ${job.title} at ${job.company}`,
      body: `Hi,\n\nI applied for the ${job.title} position at ${job.company} about ${daysSinceApplied} days ago and wanted to check in on the status of my application.\n\nI'm genuinely excited about this role and believe my experience in ${matchedSkillsStr || 'software development'} makes me a strong fit. I'd love the chance to discuss how I can contribute to your team.\n\nWould you be open to a quick call this week?\n\nBest,\n${name}`
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// 3) GENERATE TAILORED CV — with ATS score
// ═══════════════════════════════════════════════════════════════
exports.generateTailoredCV = async (job) => {
  const { text: userContext, profile, skills, projects, certs } = await buildUserContext();
  const cleanDesc = job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 4000) : '';

  const prompt = `
You are an expert CV writer and ATS (Applicant Tracking System) specialist. Create ATS-optimized CV content for this job.

===== CANDIDATE PROFILE =====
${userContext}

===== TARGET JOB =====
Title: ${job.title}
Company: ${job.company}
Description: ${cleanDesc}

===== INSTRUCTIONS =====
Create tailored, ATS-friendly CV content. Return ONLY valid JSON:

\`\`\`json
{
  "professionalSummary": "3-4 sentence ATS-optimized summary with job keywords woven in naturally",
  "highlightedSkills": ["up to 10 most relevant skills ordered by relevance to THIS job"],
  "experienceBullets": [
    { "company": "Company", "role": "Title", "duration": "Period", "bullets": ["Achievement-focused bullet with metrics", "Another bullet"] }
  ],
  "relevantProjects": [
    { "title": "Name", "description": "1-2 sentences reworded for this job context", "tech": ["relevant tech"] }
  ],
  "atsKeywords": ["exact keywords from job description that MUST appear in CV"],
  "atsScore": <number 0-100 estimating how well THIS CV would pass ATS for THIS role>,
  "suggestions": ["Specific suggestion to improve ATS further"]
}
\`\`\`

Use ONLY real candidate information. Reword to match job language while staying truthful.
Ensure all atsKeywords actually appear somewhere in the CV content you generated.
  `.trim();

  try {
    const { text, provider } = await callAI(prompt);
    const cvData = extractJSON(text);
    if (!cvData) throw new Error('Failed to parse CV JSON');
    return {
      ...cvData, provider,
      rawProfile: {
        name: profile?.name || '', title: profile?.title || '',
        email: profile?.email || '', phone: profile?.phone || '',
        location: profile?.location || '', social: profile?.social || {},
        cvPhoto: profile?.cvPhoto || '',
        education: profile?.education || [], languages: profile?.languages || [],
        certifications: certs.map(c => ({ title: c.title, issuer: c.issuer, year: c.issueDate ? new Date(c.issueDate).getFullYear() : '' }))
      },
      targetJob: { title: job.title, company: job.company }
    };
  } catch (error) {
    console.error('CV Generation Error:', error.message);
    return {
      professionalSummary: profile?.bio || '', highlightedSkills: skills.slice(0, 10).map(s => s.name),
      experienceBullets: (profile?.aboutTimeline || []).map(e => ({ company: "", role: e.title, duration: e.year, bullets: e.description ? e.description.split('\n').map(b=>b.replace(/^- /, '').trim()).filter(Boolean) : [] })),
      relevantProjects: projects.slice(0, 3).map(p => ({ title: p.title, description: p.description, tech: p.techStack || [] })),
      atsKeywords: [], atsScore: 0, suggestions: ['AI generation failed. Check API keys.'], provider: 'fallback',
      rawProfile: {
        name: profile?.name || '', title: profile?.title || '',
        email: profile?.email || '', phone: profile?.phone || '',
        location: profile?.location || '', social: profile?.social || {},
        cvPhoto: profile?.cvPhoto || '',
        education: profile?.education || [], languages: profile?.languages || [],
        certifications: certs.map(c => ({ title: c.title, issuer: c.issuer, year: c.issueDate ? new Date(c.issueDate).getFullYear() : '' }))
      },
      targetJob: { title: job.title, company: job.company }
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// 4) IMPROVE ATS — Takes current CV + job, returns improved version
// ═══════════════════════════════════════════════════════════════
exports.improveATSScore = async (currentCV, job) => {
  const cleanDesc = job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 4000) : '';

  const prompt = `
You are an ATS optimization specialist. You have a CV that scored ${currentCV.atsScore || 'unknown'}/100 for ATS compatibility. Improve it to score 90+.

===== CURRENT CV =====
Summary: ${currentCV.professionalSummary}
Skills: ${(currentCV.highlightedSkills || []).join(', ')}
Experience: ${JSON.stringify(currentCV.experienceBullets || [])}
Projects: ${JSON.stringify(currentCV.relevantProjects || [])}
Current ATS Keywords: ${(currentCV.atsKeywords || []).join(', ')}

===== TARGET JOB =====
Title: ${job.title}
Company: ${job.company}
Description: ${cleanDesc}

===== INSTRUCTIONS =====
Improve the CV content to maximize ATS score. Focus on:
1. Add missing keywords from the job description into the summary and experience bullets NATURALLY.
2. Reorder skills to match job priority.
3. Rewrite existing experience bullets to mirror job description language.
4. Keep content truthfully yours — ONLY reword existing experience.
5. CRITICAL REQUIREMENT: DO NOT hallucinate, fabricate, or add any experience, titles, metrics, or skills that are not explicitly present in the CURRENT CV profile.
6. If the job requires a skill you do not have, DO NOT add it to the skills array. Instead, put it in the "suggestions" array advising the user to learn or add it manually.

Return ONLY valid JSON (same structure as input but improved):
\`\`\`json
{
  "professionalSummary": "improved summary",
  "highlightedSkills": ["reordered and optimized skills"],
  "experienceBullets": [{ "company": "...", "role": "...", "duration": "...", "bullets": ["improved bullets"] }],
  "relevantProjects": [{ "title": "...", "description": "...", "tech": ["..."] }],
  "atsKeywords": ["comprehensive keyword list"],
  "atsScore": <new estimated score 0-100>,
  "suggestions": ["what was improved"],
  "improvements": ["specific change 1", "specific change 2"]
}
\`\`\`
  `.trim();

  try {
    const { text, provider } = await callAI(prompt);
    const improved = extractJSON(text);
    if (!improved) throw new Error('Failed to parse improved CV');
    return { ...improved, provider, rawProfile: currentCV.rawProfile, targetJob: currentCV.targetJob };
  } catch (error) {
    console.error('ATS Improve Error:', error.message);
    return { ...currentCV, suggestions: ['ATS improvement failed: ' + error.message] };
  }
};

// ═══════════════════════════════════════════════════════════════
// 5) BATCH CATEGORIZE JOBS — AI parsing of sync batches
// ═══════════════════════════════════════════════════════════════
exports.batchCategorizeJobs = async (jobs) => {
  if (!jobs || jobs.length === 0) return [];

  const jobPrompts = jobs.map((j) => `
[JOB_ID: ${j.apiId}]
Title: ${j.title}
Location: ${j.location}
Description: ${(j.description || '').substring(0, 1500)}
  `).join('\n\n---\n\n');

  const prompt = `
You are an expert HR data parsing system integrating seamlessly with a backend pipeline.
Analyze the following job postings.
Your ONLY output must be a strict JSON array.
Do NOT use the candidate's custom profile! Rely strictly on the textual job context provided below.
For each job, deduce:
- jobType: MUST be one of 'full_time', 'part_time', 'contract', 'internship', 'mini_job'. Map German terms accurately (Werkstudent -> part_time, Teilzeit -> part_time, Praktikum -> internship).
- language: The primary required speaking language or the language of the job description. MUST be 'english' or 'german' (if they explicitly require or accept English, tag it as 'english' so candidates know they can apply!).
- workMode: MUST be one of 'remote', 'hybrid', 'onsite'.

Output EXACTLY this JSON format (array of objects):
\`\`\`json
[
  {
    "apiId": "job1_id",
    "jobType": "part_time",
    "language": "english",
    "workMode": "remote"
  }
]
\`\`\`

Here are the jobs:
${jobPrompts}
  `.trim();

  const { text } = await callAI(prompt);
  const data = extractJSON(text);
  if (!Array.isArray(data)) throw new Error('AI returned invalid format (not an array)');
  return data;
};
