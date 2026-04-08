const express = require('express');
const axios = require('axios');
const JobListing = require('../models/JobListing');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────
// Infer workMode from location/title text
function inferWorkMode(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('remote')) return 'remote';
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('onsite') || t.includes('on-site') || t.includes('office')) return 'onsite';
  return 'remote'; // default for remote-job APIs
}

// Infer country from location string
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

// Normalise job type from various sources
function normaliseJobType(raw) {
  const t = (raw || '').toLowerCase().replace(/[\s_-]/g, '');
  if (t.includes('fulltime')) return 'full_time';
  if (t.includes('parttime')) return 'part_time';
  if (t.includes('contract') || t.includes('freelance')) return 'contract';
  if (t.includes('internship')) return 'internship';
  if (t.includes('minijob') || t.includes('mini')) return 'mini_job';
  return 'full_time';
}

// ─── GET /api/jobs ──────────────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const {
      search, isAnalyzed, source, workMode, country, jobType,
      page = 1, limit = 20
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (isAnalyzed === 'true') query.isAnalyzed = true;
    else if (isAnalyzed === 'false') query.isAnalyzed = false;
    if (source) query.source = source;
    if (workMode) query.workMode = workMode;
    if (country) query.country = country;
    if (jobType) query.jobType = jobType;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      JobListing.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      JobListing.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      jobs,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/jobs/stats ────────────────────────────────────
// Quick aggregation for filter dropdown values
router.get('/stats', auth, async (req, res, next) => {
  try {
    const [sources, countries, totalJobs, analyzedJobs] = await Promise.all([
      JobListing.distinct('source'),
      JobListing.distinct('country'),
      JobListing.countDocuments(),
      JobListing.countDocuments({ isAnalyzed: true })
    ]);
    res.json({ sources, countries, totalJobs, analyzedJobs });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/jobs/sync ────────────────────────────────────
// Multi-platform sync: Remotive + Arbeitnow + Jobicy + Adzuna + JSearch
router.post('/sync', auth, async (req, res, next) => {
  try {
    const { platforms = ['remotive', 'arbeitnow', 'jobicy'] } = req.body;
    let totalNew = 0;
    const errors = [];

    // ── Remotive ──
    if (platforms.includes('remotive')) {
      try {
        const resp = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=50', { timeout: 15000 });
        const items = resp.data.jobs || [];
        for (const job of items) {
          try {
            const exists = await JobListing.findOne({ apiId: `remotive_${job.id}` });
            if (!exists) {
              await JobListing.create({
                apiId: `remotive_${job.id}`,
                title: job.title,
                company: job.company_name,
                location: job.candidate_required_location || 'Remote',
                country: inferCountry(job.candidate_required_location),
                workMode: inferWorkMode(job.candidate_required_location || 'remote'),
                jobType: normaliseJobType(job.job_type),
                salary: job.salary || 'Not specified',
                description: job.description,
                url: job.url,
                tags: job.tags || [],
                source: 'remotive',
                publishedAt: new Date(job.publication_date)
              });
              totalNew++;
            }
          } catch (err) { /* skip duplicates */ }
        }
      } catch (err) {
        errors.push(`Remotive: ${err.message}`);
      }
    }

    // ── Arbeitnow ──
    if (platforms.includes('arbeitnow')) {
      try {
        const resp = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 15000 });
        const items = resp.data.data || [];
        for (const job of items.slice(0, 50)) {
          try {
            const exists = await JobListing.findOne({ apiId: `arbeitnow_${job.slug}` });
            if (!exists) {
              await JobListing.create({
                apiId: `arbeitnow_${job.slug}`,
                title: job.title,
                company: job.company_name,
                location: job.location || 'Europe',
                country: inferCountry(job.location),
                workMode: job.remote ? 'remote' : inferWorkMode(job.location),
                jobType: normaliseJobType(job.job_types?.[0] || 'full_time'),
                salary: 'Not specified',
                description: job.description || '',
                url: job.url,
                tags: job.tags || [],
                source: 'arbeitnow',
                publishedAt: new Date(job.created_at * 1000)
              });
              totalNew++;
            }
          } catch (err) { /* skip duplicates */ }
        }
      } catch (err) {
        errors.push(`Arbeitnow: ${err.message}`);
      }
    }

    // ── Jobicy ──
    if (platforms.includes('jobicy')) {
      try {
        const resp = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=50', { timeout: 15000 });
        const items = resp.data.jobs || [];
        for (const job of items) {
          try {
            const exists = await JobListing.findOne({ apiId: `jobicy_${job.id}` });
            if (!exists) {
              await JobListing.create({
                apiId: `jobicy_${job.id}`,
                title: job.jobTitle,
                company: job.companyName,
                location: job.jobGeo || 'Remote',
                country: inferCountry(job.jobGeo),
                workMode: 'remote',
                jobType: normaliseJobType(job.jobType),
                salary: job.annualSalaryMin ? `${job.salaryCurrency || '$'}${job.annualSalaryMin}-${job.annualSalaryMax}` : 'Not specified',
                description: job.jobDescription || job.jobExcerpt || '',
                url: job.url,
                tags: job.jobIndustry ? [job.jobIndustry] : [],
                source: 'jobicy',
                publishedAt: new Date(job.pubDate)
              });
              totalNew++;
            }
          } catch (err) { /* skip duplicates */ }
        }
      } catch (err) {
        errors.push(`Jobicy: ${err.message}`);
      }
    }

    // ── Adzuna (requires free API key from https://developer.adzuna.com) ──
    // Covers: Germany, UK, USA, France, Austria, and 12+ countries
    if (platforms.includes('adzuna')) {
      const adzunaAppId = process.env.ADZUNA_APP_ID;
      const adzunaKey = process.env.ADZUNA_API_KEY;
      if (!adzunaAppId || !adzunaKey) {
        errors.push('Adzuna: ADZUNA_APP_ID and ADZUNA_API_KEY not set in .env');
      } else {
        // Fetch from Germany (de) and worldwide
        const adzunaCountries = ['de', 'gb', 'us', 'at'];
        for (const cc of adzunaCountries) {
          try {
            const resp = await axios.get(
              `https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${adzunaAppId}&app_key=${adzunaKey}&results_per_page=25&what=software+developer&content-type=application/json`,
              { timeout: 15000 }
            );
            const items = resp.data.results || [];
            for (const job of items) {
              try {
                const exists = await JobListing.findOne({ apiId: `adzuna_${job.id}` });
                if (!exists) {
                  await JobListing.create({
                    apiId: `adzuna_${job.id}`,
                    title: job.title,
                    company: job.company?.display_name || 'Unknown',
                    location: job.location?.display_name || cc.toUpperCase(),
                    country: inferCountry(job.location?.display_name || cc),
                    workMode: inferWorkMode(job.title + ' ' + (job.description || '')),
                    jobType: normaliseJobType(job.contract_time || 'full_time'),
                    salary: job.salary_min ? `${job.salary_min}-${job.salary_max} ${job.salary_currency || 'EUR'}` : 'Not specified',
                    description: job.description || '',
                    url: job.redirect_url || job.url || '',
                    tags: job.category ? [job.category.label] : [],
                    source: 'adzuna',
                    publishedAt: new Date(job.created)
                  });
                  totalNew++;
                }
              } catch (err) { /* skip duplicates */ }
            }
          } catch (err) {
            errors.push(`Adzuna (${cc}): ${err.message}`);
          }
        }
      }
    }

    // ── JSearch via RapidAPI (aggregates Google Jobs, LinkedIn, Indeed, Glassdoor) ──
    // Requires free API key from https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
    if (platforms.includes('jsearch')) {
      const jsearchKey = process.env.JSEARCH_API_KEY;
      if (!jsearchKey) {
        errors.push('JSearch: JSEARCH_API_KEY not set in .env (get free key from RapidAPI)');
      } else {
        try {
          const resp = await axios.get('https://jsearch.p.rapidapi.com/search', {
            params: {
              query: 'software developer in Germany',
              page: '1',
              num_pages: '1'
            },
            headers: {
              'X-RapidAPI-Key': jsearchKey,
              'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            },
            timeout: 15000
          });
          const items = resp.data.data || [];
          for (const job of items) {
            try {
              const exists = await JobListing.findOne({ apiId: `jsearch_${job.job_id}` });
              if (!exists) {
                await JobListing.create({
                  apiId: `jsearch_${job.job_id}`,
                  title: job.job_title,
                  company: job.employer_name || 'Unknown',
                  location: `${job.job_city || ''} ${job.job_state || ''} ${job.job_country || ''}`.trim(),
                  country: inferCountry(job.job_country || job.job_city || ''),
                  workMode: job.job_is_remote ? 'remote' : 'onsite',
                  jobType: normaliseJobType(job.job_employment_type || 'full_time'),
                  salary: job.job_min_salary ? `${job.job_min_salary}-${job.job_max_salary} ${job.job_salary_currency || ''}` : 'Not specified',
                  description: job.job_description || '',
                  url: job.job_apply_link || job.job_google_link || '',
                  tags: job.job_required_skills || [],
                  source: 'jsearch',
                  publishedAt: new Date(job.job_posted_at_datetime_utc || Date.now())
                });
                totalNew++;
              }
            } catch (err) { /* skip duplicates */ }
          }
        } catch (err) {
          errors.push(`JSearch: ${err.message}`);
        }
      }
    }

    const msg = `Sync complete. ${totalNew} new jobs added from ${platforms.join(', ')}.` +
      (errors.length ? ` Warnings: ${errors.join('; ')}` : '');
    res.json({ message: msg, newJobs: totalNew });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/jobs/:id/analyze ─────────────────────────────
router.post('/:id/analyze', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const aiAnalysisResult = await geminiService.analyzeJobMatch(job);

    job.isAnalyzed = true;
    job.matchScore = aiAnalysisResult.matchScore;
    job.aiRecommendation = aiAnalysisResult.recommendation;
    await job.save();

    res.json({ message: 'Analysis complete', job });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/jobs/:id/applied ────────────────────────────
// Mark a job as "applied" for tracking
router.patch('/:id/applied', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.hasApplied = true;
    job.appliedAt = new Date();
    await job.save();
    res.json({ message: 'Marked as applied', job });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/jobs/applied ──────────────────────────────────
// List all jobs that have been marked as applied
router.get('/applied', auth, async (req, res, next) => {
  try {
    const jobs = await JobListing.find({ hasApplied: true }).sort({ appliedAt: -1 });
    res.json({ jobs, total: jobs.length });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/jobs/reset ─────────────────────────────────
// Wipe all jobs from DB (Reset button)
router.delete('/reset', auth, async (req, res, next) => {
  try {
    const result = await JobListing.deleteMany({});
    res.json({ message: `Reset complete. ${result.deletedCount} jobs removed.` });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/jobs/:id ───────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const job = await JobListing.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
