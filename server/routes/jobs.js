const express = require('express');
const axios = require('axios');
const JobListing = require('../models/JobListing');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const cheerio = require('cheerio');

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────
function inferWorkMode(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('remote')) return 'remote';
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('onsite') || t.includes('on-site') || t.includes('office')) return 'onsite';
  return 'remote';
}

function inferCountry(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('germany') || loc.includes('deutschland') || loc.includes('berlin') || loc.includes('munich') || loc.includes('hamburg') || loc.includes('frankfurt')) return 'Germany';
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('u.s.')) return 'USA';
  if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london')) return 'UK';
  if (loc.includes('canada')) return 'Canada';
  if (loc.includes('netherlands') || loc.includes('amsterdam')) return 'Netherlands';
  if (loc.includes('france') || loc.includes('paris')) return 'France';
  if (loc.includes('spain') || loc.includes('madrid') || loc.includes('barcelona')) return 'Spain';
  if (loc.includes('austria') || loc.includes('vienna') || loc.includes('wien')) return 'Austria';
  if (loc.includes('switzerland') || loc.includes('zurich') || loc.includes('zürich')) return 'Switzerland';
  if (loc.includes('worldwide') || loc.includes('anywhere') || loc === '') return 'Worldwide';
  return 'Other';
}

function normaliseJobType(raw) {
  let val = raw;
  if (Array.isArray(raw)) val = raw[0]; // Extract first value if API returns an Array
  const t = (val || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  if (t.includes('fulltime') || t.includes('vollzeit')) return 'full_time';
  if (t.includes('parttime') || t.includes('teilzeit') || t.includes('halbtags')) return 'part_time';
  if (t.includes('werkstudent')) return 'part_time'; // Common DE student contract
  if (t.includes('contract') || t.includes('freelance') || t.includes('befristet')) return 'contract';
  if (t.includes('internship') || t.includes('praktikum') || t.includes('trainee')) return 'internship';
  if (t.includes('minijob') || t.includes('mini')) return 'mini_job';
  return 'full_time';
}

function smartJobTypeDetection(apiJobType, description, title) {
  const apiType = normaliseJobType(apiJobType);
  const cleanDesc = (description || '').replace(/<[^>]*>/g, '').toLowerCase();
  const cleanTitle = (title || '').toLowerCase();
  
  // Title carries maximum weight (strict override)
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
  
  // English-Friendly Override: Even if the job posting is written in deep German context,
  // if it explicitly mentions requirements/acceptance of English, treat it as "English" 
  // so that English-seeking users can still find it!
  const englishFriendlyRegex = /\b(fluent english|english speaking|english required|english is acceptable|good english|excellent english|business english|englischkenntnisse|gute englisch|fließend englisch|englisch in wort)\b/i;
  
  if (englishFriendlyRegex.test(clean)) {
    return 'english';
  }

  // Only classify as German if German strongly outweighs English. 
  // This prevents falsely tagging English jobs that have a standard German boilerplate footer.
  return deCount > enCount + 2 ? 'german' : 'english';
}

// ─── Search-aware helpers ───────────────────────────────────
// Build German equivalents of common English job search terms
function getSearchVariants(query) {
  if (!query) return [];
  const mappings = {
    'developer': 'Entwickler', 'software developer': 'Softwareentwickler',
    'web developer': 'Webentwickler', 'full stack': 'Full-Stack',
    'frontend': 'Frontend', 'backend': 'Backend',
    'engineer': 'Ingenieur', 'software engineer': 'Softwareingenieur',
    'data scientist': 'Datenwissenschaftler', 'designer': 'Designer',
    'project manager': 'Projektmanager', 'devops': 'DevOps',
    'consultant': 'Berater', 'analyst': 'Analyst', 'architect': 'Architekt'
  };
  const terms = [query.toLowerCase()];
  const lower = query.toLowerCase();
  for (const [en, de] of Object.entries(mappings)) {
    if (lower.includes(en)) {
      terms.push(lower.replace(new RegExp(en, 'gi'), de));
    }
  }
  // Also add individual words from the DE translations
  for (const [en] of Object.entries(mappings)) {
    if (lower.includes(en)) terms.push(mappings[en].toLowerCase());
  }
  return [...new Set(terms)];
}

// Check if a job matches any search variant (for APIs without search)
function jobMatchesSearch(job, searchVariants) {
  if (!searchVariants.length) return true;
  const text = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
  return searchVariants.some(v => text.includes(v));
}

// ─── GET /api/jobs ──────────────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const { search, isAnalyzed, source, workMode, country, jobType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search || req.query.location) {
      query.$and = [];
      if (search) {
        query.$and.push({ $or: [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]});
      }
      if (req.query.location) {
        query.$and.push({ $or: [
          { location: { $regex: req.query.location, $options: 'i' } },
          { country: { $regex: req.query.location, $options: 'i' } }
        ]});
      }
    }
    
    if (isAnalyzed === 'true') query.isAnalyzed = true;
    else if (isAnalyzed === 'false') query.isAnalyzed = false;
    if (source) query.source = source;
    if (workMode) query.workMode = workMode;
    if (country) query.country = country;
    if (req.query.language) query.language = req.query.language;
    if (jobType) query.jobType = jobType;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      JobListing.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limitNum),
      JobListing.countDocuments(query)
    ]);

    res.json({ jobs, total, page: pageNum, totalPages: Math.ceil(total / limitNum), hasMore: pageNum < Math.ceil(total / limitNum) });
  } catch (error) { next(error); }
});

// ─── GET /api/jobs/stats ────────────────────────────────────
router.get('/stats', auth, async (req, res, next) => {
  try {
    const [sources, countries, totalJobs, analyzedJobs, appliedJobs] = await Promise.all([
      JobListing.distinct('source'),
      JobListing.distinct('country'),
      JobListing.countDocuments(),
      JobListing.countDocuments({ isAnalyzed: true }),
      JobListing.countDocuments({ hasApplied: true })
    ]);
    const statusCounts = await JobListing.aggregate([
      { $match: { hasApplied: true } },
      { $group: { _id: '$applicationStatus', count: { $sum: 1 } } }
    ]);
    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const appsOverTime = await JobListing.aggregate([
      { $match: { hasApplied: true, appliedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ sources, countries, totalJobs, analyzedJobs, appliedJobs, statusCounts: statusMap, appsOverTime: appsOverTime.map(d => ({ date: d._id, count: d.count })) });
  } catch (error) { next(error); }
});

// ─── GET /api/jobs/applied ──────────────────────────────────
router.get('/applied', auth, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { hasApplied: true };
    if (status) query.applicationStatus = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const [jobs, total] = await Promise.all([
      JobListing.find(query).sort({ appliedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      JobListing.countDocuments(query)
    ]);
    res.json({ jobs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/sync ────────────────────────────────────
router.post('/sync', auth, async (req, res, next) => {
  try {
    const { platforms = ['remotive', 'arbeitnow', 'jobicy', 'themuse'], searchQuery = '', locationQuery = '', language = '', jobType = '' } = req.body;
    
    // Fix: NEVER combine Role, Language, and Type into one massive API query string.
    // External APIs treat spaces as mathematical AND. Searching "werkstudent english part-time"
    // forces the API to find a single job with all 3 words in the title, which returns 0 results!
    // Instead, we purely request the user's role, and natively filter it down locally.
    const apiSearchQuery = searchQuery.trim() || (jobType ? jobType.replace('_', ' ') : 'jobs');

    const searchVariants = getSearchVariants(searchQuery);
    
    let allFetchedJobs = [];
    const errors = [];

    // ── Remotive ──
    if (platforms.includes('remotive')) {
      try {
        const q = `${apiSearchQuery} ${locationQuery || ''}`.trim();
        const url = q ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=50` : 'https://remotive.com/api/remote-jobs?limit=50';
        const resp = await axios.get(url, { timeout: 15000 });
        for (const job of (resp.data.jobs || [])) {
          allFetchedJobs.push({
            apiId: `remotive_${job.id}`, title: job.title, company: job.company_name,
            location: job.candidate_required_location || 'Remote',
            country: inferCountry(job.candidate_required_location),
            salary: job.salary || 'Not specified', description: job.description || '', url: job.url,
            tags: job.tags || [], source: 'remotive', publishedAt: new Date(job.publication_date),
            _apiJobType: job.job_type, _apiWorkMode: inferWorkMode(job.candidate_required_location || 'remote')
          });
        }
      } catch (err) { errors.push(`Remotive: ${err.message}`); }
    }

    // ── Arbeitnow ──
    if (platforms.includes('arbeitnow')) {
      try {
        const resp = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 15000 });
        for (const job of (resp.data.data || []).slice(0, 80)) {
          allFetchedJobs.push({
            apiId: `arbeitnow_${job.slug}`, title: job.title, company: job.company_name,
            location: job.location || 'Europe', country: inferCountry(job.location),
            salary: 'Not specified', description: job.description || '', url: job.url,
            tags: job.tags || [], source: 'arbeitnow', publishedAt: new Date(job.created_at * 1000),
            _enforceLocation: true, _apiJobType: job.job_types?.[0] || 'full_time', _apiWorkMode: job.remote ? 'remote' : inferWorkMode(job.location)
          });
        }
      } catch (err) { errors.push(`Arbeitnow: ${err.message}`); }
    }

    // ── Jobicy ──
    if (platforms.includes('jobicy')) {
      try {
        // Fix for Jobicy 400 Error: Jobicy tag rejects long strings, so we only pass the first word or skip the tag entirely
        const tag = apiSearchQuery.split(' ')[0]; 
        const url = tag ? `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}` : 'https://jobicy.com/api/v2/remote-jobs?count=50';
        const resp = await axios.get(url, { timeout: 15000 });
        for (const job of (resp.data.jobs || [])) {
          allFetchedJobs.push({
            apiId: `jobicy_${job.id}`, title: job.jobTitle, company: job.companyName,
            location: job.jobGeo || 'Remote', country: inferCountry(job.jobGeo),
            salary: job.annualSalaryMin ? `${job.salaryCurrency || '$'}${job.annualSalaryMin}-${job.annualSalaryMax}` : 'Not specified',
            description: job.jobDescription || job.jobExcerpt || '', url: job.url, tags: job.jobIndustry ? [job.jobIndustry] : [],
            source: 'jobicy', publishedAt: new Date(job.pubDate),
            _apiJobType: job.jobType, _apiWorkMode: 'remote'
          });
        }
      } catch (err) { errors.push(`Jobicy: ${err.message}`); }
    }

    // ── Adzuna ──
    if (platforms.includes('adzuna')) {
      const adzunaAppId = process.env.ADZUNA_APP_ID;
      const adzunaKey = process.env.ADZUNA_API_KEY;
      if (!adzunaAppId || !adzunaKey) {
        errors.push('Adzuna: API keys not set');
      } else {
        const adzunaCountries = ['de', 'gb', 'us', 'at'];
        for (const cc of adzunaCountries) {
          try {
            const whereQuery = locationQuery ? `&where=${encodeURIComponent(locationQuery)}` : '';
            const resp = await axios.get(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${adzunaAppId}&app_key=${adzunaKey}&results_per_page=25&what=${encodeURIComponent(apiSearchQuery || 'jobs')}${whereQuery}&content-type=application/json`, { timeout: 15000 });
            for (const job of (resp.data.results || [])) {
              allFetchedJobs.push({
                apiId: `adzuna_${job.id}`, title: job.title, company: job.company?.display_name || 'Unknown',
                location: job.location?.display_name || cc.toUpperCase(), country: inferCountry(job.location?.display_name || cc),
                salary: job.salary_min ? `${job.salary_min}-${job.salary_max} ${job.salary_currency || 'EUR'}` : 'Not specified',
                description: job.description || '', url: job.redirect_url || job.url || '', tags: job.category ? [job.category.label] : [], source: 'adzuna', publishedAt: new Date(job.created),
                _apiJobType: job.contract_time || 'full_time', _apiWorkMode: inferWorkMode(job.title + ' ' + (job.description || ''))
              });
            }
          } catch (err) { errors.push(`Adzuna (${cc}): ${err.message}`); }
        }
      }
    }

    // ── JSearch ──
    if (platforms.includes('jsearch')) {
      const jsearchKey = process.env.JSEARCH_API_KEY;
      if (!jsearchKey) {
        errors.push('JSearch: API key not set');
      } else {
        try {
          const jsearchQuery = `${apiSearchQuery || 'jobs'} ${locationQuery ? `in ${locationQuery}` : 'remote'}`;
          const resp = await axios.get('https://jsearch.p.rapidapi.com/search', {
            params: { query: jsearchQuery, page: '1', num_pages: '1' },
            headers: { 'X-RapidAPI-Key': jsearchKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' }, timeout: 15000
          });
          for (const job of (resp.data.data || [])) {
            allFetchedJobs.push({
              apiId: `jsearch_${job.job_id}`, title: job.job_title, company: job.employer_name || 'Unknown',
              location: `${job.job_city || ''} ${job.job_state || ''} ${job.job_country || ''}`.trim(),
              country: inferCountry(job.job_country || job.job_city || ''),
              salary: job.job_min_salary ? `${job.job_min_salary}-${job.job_max_salary} ${job.job_salary_currency || ''}` : 'Not specified',
              description: job.job_description || '', url: job.job_apply_link || job.job_google_link || '',
              tags: job.job_required_skills || [], source: 'jsearch', publishedAt: new Date(job.job_posted_at_datetime_utc || Date.now()),
              _apiJobType: job.job_employment_type || 'full_time', _apiWorkMode: job.job_is_remote ? 'remote' : 'onsite'
            });
          }
        } catch (err) { errors.push(`JSearch: ${err.message}`); }
      }
    }

    // ── The Muse ──
    if (platforms.includes('themuse')) {
      try {
        const resp = await axios.get(`https://www.themuse.com/api/public/jobs?page=${Math.floor(Math.random() * 5) + 1}`, { timeout: 15000 });
        for (const job of (resp.data.results || [])) {
          const locStr = job.locations?.[0]?.name || 'Remote';
          allFetchedJobs.push({
            apiId: `themuse_${job.id}`, title: job.name, company: job.company?.name || 'Unknown',
            location: locStr, country: inferCountry(locStr),
            salary: 'Not specified', description: job.contents || '', url: job.refs?.landing_page || '',
            tags: job.categories?.map(c => c.name) || [], source: 'themuse', publishedAt: new Date(job.publication_date),
            _enforceLocation: true, _apiJobType: 'full_time', _apiWorkMode: inferWorkMode(locStr)
          });
        }
      } catch (err) { errors.push(`TheMuse: ${err.message}`); }
    }

    // Deduplicate DB natively
    const apiIds = allFetchedJobs.map(j => j.apiId);
    const existingJobs = await JobListing.find({ apiId: { $in: apiIds } }).select('apiId');
    const existingIds = new Set(existingJobs.map(j => j.apiId));
    let newJobs = allFetchedJobs.filter(j => !existingIds.has(j.apiId));

    // Base Title/Location filtering natively enforced strictly on ALL platforms
    newJobs = newJobs.filter(jobData => {
      // Role search strict validation
      if (searchVariants.length && !jobMatchesSearch(jobData, searchVariants)) return false;
      
      // Strict Location Enforcement locally (fixing the bug where APIs inject random Global jobs)
      if (locationQuery) {
        const qLoc = locationQuery.toLowerCase();
        const jLoc = (jobData.location || '').toLowerCase();
        const jCty = (jobData.country || '').toLowerCase();
        if (!jLoc.includes(qLoc) && !jCty.includes(qLoc)) return false;
      }
      return true;
    });

    // Intelligent Script-Based Categorization Pipeline (No external AI calls)
    let finalJobsToInsert = newJobs.map(job => {
      job.jobType = smartJobTypeDetection(job._apiJobType || 'full_time', job.description, job.title);
      job.language = detectLanguage(job.description + ' ' + job.title);
      job.workMode = job._apiWorkMode || inferWorkMode(job.location);
      
      delete job._apiJobType;
      delete job._apiWorkMode;
      delete job._enforceLocation;
      
      return job;
    });

    // POST-CATEGORIZATION STRICT FILTERING
    // Ensures whatever the categorization scripts detected mathematically matches the dropdowns.
    if (jobType) {
      finalJobsToInsert = finalJobsToInsert.filter(job => job.jobType === jobType);
    }
    if (language) {
      finalJobsToInsert = finalJobsToInsert.filter(job => {
        // --- GERMAN CONTEXT BYPASS ---
        // If the user selects "Language: English" but explicitly types a German role ("werkstudent"),
        // strictly filtering out "German" language jobs would discard exactly what they asked for!
        if (language === 'english' && job.language === 'german') {
          const q = searchQuery.toLowerCase();
          const germanRoles = ['werkstudent', 'teilzeit', 'minijob', 'entwickler', 'praktikum', 'aushilfe'];
          if (q && germanRoles.some(gr => q.includes(gr))) return true; 
        }
        return job.language === language;
      });
    }

    if (finalJobsToInsert.length > 0) {
      await JobListing.insertMany(finalJobsToInsert, { ordered: false });
    }

    const queryNote = searchQuery ? ` for "${searchQuery}"` : '';
    const msg = `Sync complete${queryNote}. ${finalJobsToInsert.length} new jobs categorized and added.` +
      (errors.length ? ` Warnings: ${errors.join('; ')}` : '');
    res.json({ message: msg, newJobs: finalJobsToInsert.length });
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/scrape ────────────────────────────────────
// Accepts a URL or raw text, extracts fields using AI or Cheerio, and runs analyzeJobMatch instantly
router.post('/scrape', auth, async (req, res, next) => {
  try {
    const { url, rawText } = req.body;
    let content = rawText || '';

    if (!content && url) {
      try {
        const fetchRes = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(fetchRes.data);
        $('script, style, nav, footer, iframe, noscript').remove();
        content = $('body').text().replace(/\s+/g, ' ').trim();
      } catch (err) {
        return res.status(400).json({ message: 'Failed to scrape URL. The site might be protected. Please copy and paste the job description manually into the text box.' });
      }
    }

    if (!content || content.length < 50) {
      return res.status(400).json({ message: 'Not enough text content found or provided.' });
    }

    // Attempt to parse out basic Title/Company via a rapid localized AI prompt before full analysis
    // Usually job matches want title and company to cleanly map.
    // We will just do a lightweight generic fallback if we don't have them explicitly.
    const genericJobObject = {
      title: 'Custom Job URL/Text',
      company: 'External Link',
      location: 'Remote/Unknown',
      jobType: 'full_time',
      language: 'english', // Assuming translation handles it
      description: content.substring(0, 15000)
    };

    const analysisResult = await aiService.analyzeJobMatch(genericJobObject);

    res.json({
      job: genericJobObject,
      analysis: analysisResult
    });
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/custom ──────────────────────────────────
router.post('/custom', auth, async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.url) data.url = 'manual_custom_entry';
    if (!data.apiId) data.apiId = 'custom_' + Date.now() + Math.floor(Math.random() * 1000);
    const job = new JobListing(data);
    await job.save();
    res.json(job);
  } catch(error) { next(error); }
});

// ─── POST /api/jobs/:id/analyze ─────────────────────────────
router.post('/:id/analyze', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const result = await aiService.analyzeJobMatch(job);
    job.isAnalyzed = true;
    job.matchScore = result.matchScore;
    job.aiRecommendation = result.recommendation;
    job.aiProvider = result.provider;
    job.matchBreakdown = result.matchBreakdown;
    job.matchedSkills = result.matchedSkills;
    job.missingSkills = result.missingSkills;
    await job.save();
    res.json({ message: 'Analysis complete', job });
  } catch (error) { next(error); }
});

// ─── PATCH /api/jobs/:id/applied ────────────────────────────
router.patch('/:id/applied', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.hasApplied = true;
    job.appliedAt = new Date();
    job.applicationStatus = 'applied';
    await job.save();
    res.json({ message: 'Marked as applied', job });
  } catch (error) { next(error); }
});

// ─── PATCH /api/jobs/:id/status ─────────────────────────────
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['applied', 'followedup', 'confirmed', 'rejected', 'on_hold'];
    if (!valid.includes(status)) return res.status(400).json({ message: `Invalid status` });
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.applicationStatus = status;
    await job.save();
    res.json({ message: 'Status updated', job });
  } catch (error) { next(error); }
});

// ─── PATCH /api/jobs/:id/notes ──────────────────────────────
router.patch('/:id/notes', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.applicationNotes = req.body.notes || '';
    await job.save();
    res.json({ message: 'Notes saved', job });
  } catch (error) { next(error); }
});

// ─── PATCH /api/jobs/:id/contact-email ──────────────────────
router.patch('/:id/contact-email', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.contactEmail = req.body.email || '';
    await job.save();
    res.json({ message: 'Contact email saved', job });
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/:id/followup-email ──────────────────────
router.post('/:id/followup-email', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!job.contactEmail) return res.status(400).json({ message: 'No contact email set.' });
    const emailContent = await aiService.generateFollowUpEmail(job);
    const sendResult = await emailService.sendFollowUpEmail({
      to: job.contactEmail, subject: emailContent.subject, body: emailContent.body
    });
    if (sendResult.success) {
      job.followUpCount = (job.followUpCount || 0) + 1;
      job.lastFollowUpAt = new Date();
      job.applicationStatus = 'followedup';
      await job.save();
      res.json({ message: 'Follow-up email sent!', emailPreview: { subject: emailContent.subject, body: emailContent.body }, job });
    } else {
      res.json({ message: sendResult.error || 'SMTP not configured — preview generated.', emailPreview: { subject: emailContent.subject, body: emailContent.body }, manualMode: true, job });
    }
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/:id/generate-cv ─────────────────────────
router.post('/:id/generate-cv', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const cvData = await aiService.generateTailoredCV(job);
    // Store ATS score on the job after CV is generated
    if (cvData.atsScore) {
      job.atsScore = cvData.atsScore;
      await job.save();
    }
    res.json({ message: 'CV generated', cvData });
  } catch (error) { next(error); }
});

// ─── POST /api/jobs/:id/improve-ats ─────────────────────────
router.post('/:id/improve-ats', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const { currentCV } = req.body;
    if (!currentCV) return res.status(400).json({ message: 'Current CV data required' });
    const improved = await aiService.improveATSScore(currentCV, job);
    if (improved.atsScore) {
      job.atsScore = improved.atsScore;
      await job.save();
    }
    res.json({ message: 'ATS improved', cvData: improved });
  } catch (error) { next(error); }
});

// ─── DELETE /api/jobs/reset ─────────────────────────────────
router.delete('/reset', auth, async (req, res, next) => {
  try {
    const includeApplied = req.query.includeApplied === 'true';
    const filter = includeApplied ? {} : { hasApplied: { $ne: true } };
    const result = await JobListing.deleteMany(filter);
    const appliedCount = includeApplied ? 0 : await JobListing.countDocuments({ hasApplied: true });
    const msg = `Reset complete. ${result.deletedCount} jobs removed.` +
      (appliedCount > 0 ? ` ${appliedCount} applied jobs preserved.` : '');
    res.json({ message: msg, preserved: appliedCount });
  } catch (error) { next(error); }
});

// ─── DELETE /api/jobs/:id ───────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
