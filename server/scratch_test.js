const axios = require('axios');
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
function getSearchVariants(query) {
  if (!query) return [];
  const mappings = {
    'developer': 'Entwickler', 'software developer': 'Softwareentwickler', 'werkstudent': 'working student'
  };
  const terms = [query.toLowerCase()];
  return terms;
}
function jobMatchesSearch(job, searchVariants) {
  if (!searchVariants.length) return true;
  const text = (job.title || '') + ' ' + (job.company || '') + ' ' + (job.description || '') + ' ' + (job.tags || []).join(' ');
  return searchVariants.some(v => text.toLowerCase().includes(v));
}

async function testSync() {
  const searchQuery = 'werkstudent';
  const locationQuery = '';
  const jobType = '';
  
  const searchVariants = getSearchVariants(searchQuery);
  let allFetchedJobs = [];
  
  const adzRes = await axios.get('https://api.adzuna.com/v1/api/jobs/de/search/1?app_id=c76908e3&app_key=d3d8a8aa81fedb6a618898d745d9c8fb&results_per_page=15&what=' + encodeURIComponent(searchQuery));
  console.log('Adzuna Fetched:', adzRes.data.results.length);
  for (const job of adzRes.data.results) {
    allFetchedJobs.push({
      title: job.title, company: job.company?.display_name,
      location: job.location?.display_name, country: 'Germany',
      description: job.description, _apiJobType: job.contract_time
    });
  }

  let finalJobs = allFetchedJobs.filter(job => {
    const m = jobMatchesSearch(job, searchVariants);
    if (!m) console.log('Dropped by Search:', job.title);
    return m;
  });
  
  finalJobs = finalJobs.map(job => {
    job.jobType = smartJobTypeDetection(job._apiJobType || 'full_time', job.description, job.title);
    return job;
  });
  
  if (jobType) {
    let before = finalJobs.length;
    finalJobs = finalJobs.filter(j => j.jobType === jobType);
    console.log('Dropped by strict jobType:', before - finalJobs.length);
  }
  
  console.log('Final remaining:', finalJobs.length);
  if(finalJobs.length > 0) { console.log('Sample:', finalJobs[0].title, finalJobs[0].jobType); }
}
testSync();
