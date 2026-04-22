const axios = require('axios');

function detectLanguage(text) {
  const clean = (text || '').toLowerCase();
  const germanWords = [
    'und', 'für', 'die', 'der', 'das', 'wir', 'suchen', 'stelle', 'bewerbung', 'anforderungen',
    'erfahrung', 'kenntnisse', 'aufgaben', 'qualifikation', 'vollzeit', 'teilzeit',
    'festanstellung', 'arbeitsort', 'homeoffice', 'berufserfahrung', 'unternehmen',
    'mitarbeiter', 'bewerben', 'gehalt', 'arbeitszeit'
  ];
  const englishWords = [
    'and', 'for', 'the', 'we', 'are', 'looking', 'job', 'application', 'requirements',
    'experience', 'knowledge', 'responsibilities', 'qualifications', 'full-time',
    'part-time', 'location', 'company', 'employees', 'apply', 'salary', 'working'
  ];
  
  const deCount = germanWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(clean)).length;
  const enCount = englishWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(clean)).length;
  
  const englishFriendlyRegex = /\b(fluent english|english speaking|english required|english is acceptable|good english|excellent english|business english|englischkenntnisse|gute englisch|fließend englisch|englisch in wort)\b/i;
  
  if (englishFriendlyRegex.test(clean)) {
    return { lang: 'english', reason: 'friendly-regex' };
  }

  return deCount > enCount + 2 ? { lang: 'german', deCount, enCount } : { lang: 'english', deCount, enCount };
}

function normaliseJobType(raw) {
  let val = raw;
  if (Array.isArray(raw)) val = raw[0];
  const t = (val || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  if (t.includes('fulltime') || t.includes('vollzeit')) return 'full_time';
  if (t.includes('parttime') || t.includes('teilzeit') || t.includes('halbtags')) return 'part_time';
  if (t.includes('werkstudent')) return 'part_time';
  if (t.includes('contract') || t.includes('freelance') || t.includes('befristet')) return 'contract';
  if (t.includes('internship') || t.includes('praktikum') || t.includes('trainee')) return 'internship';
  if (t.includes('minijob') || t.includes('mini')) return 'mini_job';
  return 'full_time';
}

function smartJobTypeDetection(apiJobType, description, title) {
  const apiType = normaliseJobType(apiJobType);
  const cleanTitle = (title || '').toLowerCase();
  const cleanDesc = (description || '').replace(/<[^>]*>/g, '').toLowerCase();
  const titleSignals = {
    part_time: /\b(part[\s-]?time|teilzeit|werkstudent)\b/i,
    mini_job: /\b(mini[\s-]?job|450[\s€]?|520[\s€]?|geringfügig)\b/i,
    internship: /\b(internship|praktikum|trainee)\b/i,
    contract: /\b(contract|freelance|befristet|freiberuflich)\b/i,
    full_time: /\b(full[\s-]?time|vollzeit)\b/i
  };
  for (const [type, pattern] of Object.entries(titleSignals)) {
    if (cleanTitle.match(pattern)) return type;
  }
  const fullText = cleanTitle + ' ' + cleanDesc;
  const signals = {
    full_time: /\b(full[\s-]?time|vollzeit|40\s*h|38\.5\s*h|permanent position|festanstellung)\b/gi,
    part_time: /\b(part[\s-]?time|teilzeit|20\s*h|half[\s-]?time|halbtags|werkstudent)\b/gi,
    contract: /\b(contract|freelance|befristet|temporary|fixed[\s-]?term|freiberuflich)\b/gi,
    internship: /\b(internship|praktikum|trainee)\b/gi,
    mini_job: /\b(mini[\s-]?job|450[\s€]|520[\s€]|geringfügig)\b/gi
  };
  const descSignals = {};
  for (const [type, pattern] of Object.entries(signals)) {
    const matches = fullText.match(pattern);
    descSignals[type] = matches ? matches.length : 0;
  }
  const strongest = Object.entries(descSignals).sort((a, b) => b[1] - a[1])[0];
  if (strongest[1] >= 2 && strongest[0] !== apiType) return strongest[0];
  return apiType;
}

async function testPipeline() {
  const searchQuery = 'werkstudent';
  const locationQuery = ''; // empty bypasses strict loc filter
  const jobType = 'part_time';
  const language = 'english'; // This is what is probably killing the jobs

  const apiSearchQuery = searchQuery;
  let allFetchedJobs = [];
  
  try {
    const adzRes = await axios.get('https://api.adzuna.com/v1/api/jobs/de/search/1?app_id=c76908e3&app_key=d3d8a8aa81fedb6a618898d745d9c8fb&results_per_page=15&what=' + encodeURIComponent(apiSearchQuery));
    console.log('Adzuna Found:', adzRes.data.results.length);
    for (const job of adzRes.data.results) {
      allFetchedJobs.push({ title: job.title, loc: job.location?.display_name, desc: job.description, apiType: job.contract_time });
    }
  } catch(e) { console.error(e.message); }

  console.log('--- FILTERING PROCESS ---');
  let validJobs = 0;
  allFetchedJobs.forEach(job => {
    const detectedType = smartJobTypeDetection(job.apiType || 'full_time', job.desc, job.title);
    const langObj = detectLanguage(job.desc + ' ' + job.title);
    
    let droppedBy = '';
    if (jobType && detectedType !== jobType) droppedBy = 'JobType Mismatch (' + detectedType + ')';
    else if (language && langObj.lang !== language) droppedBy = 'Language Mismatch (' + langObj.lang + ', ' + JSON.stringify(langObj) + ')';
    
    if (droppedBy) {
      console.log('DROPPED:', job.title.substring(0,30), '->', droppedBy);
    } else {
      console.log('PASSED: ', job.title.substring(0,30));
      validJobs++;
    }
  });
  console.log('Total valid jobs at the end:', validJobs);
}
testPipeline();
