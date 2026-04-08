import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import { jobApi } from '../../api/jobsApi';

const PLATFORMS = [
  { id: 'remotive', label: 'Remotive', desc: 'Remote tech jobs worldwide (no key)' },
  { id: 'arbeitnow', label: 'Arbeitnow', desc: 'Europe & Germany jobs (no key)' },
  { id: 'jobicy', label: 'Jobicy', desc: 'Remote jobs, all industries (no key)' },
  { id: 'adzuna', label: 'Adzuna', desc: 'DE/UK/US/AT — free key from developer.adzuna.com' },
  { id: 'jsearch', label: 'JSearch', desc: 'Google Jobs + LinkedIn + Indeed (free RapidAPI key)' }
];

const WORK_MODES = [
  { value: '', label: 'All Modes' },
  { value: 'remote', label: '🏠 Remote' },
  { value: 'hybrid', label: '🔄 Hybrid' },
  { value: 'onsite', label: '🏢 Onsite' }
];

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract / Freelance' },
  { value: 'mini_job', label: 'Mini Job' },
  { value: 'internship', label: 'Internship' }
];

const PAGE_SIZE = 20;

export default function JobMatcher() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [isAnalyzedFilter, setIsAnalyzedFilter] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobType, setJobType] = useState('');
  const [country, setCountry] = useState('');
  const [source, setSource] = useState('');

  // Sync platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState(['remotive', 'arbeitnow', 'jobicy']);
  const [showSyncOptions, setShowSyncOptions] = useState(false);

  // Stats
  const [stats, setStats] = useState({ sources: [], countries: [], totalJobs: 0, analyzedJobs: 0 });

  // ── Fetch jobs ──
  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (isAnalyzedFilter) params.isAnalyzed = isAnalyzedFilter;
      if (workMode) params.workMode = workMode;
      if (jobType) params.jobType = jobType;
      if (country) params.country = country;
      if (source) params.source = source;

      const res = await jobApi.getJobs(params);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setLoading(false);
    }
  }, [search, isAnalyzedFilter, workMode, jobType, country, source]);

  const fetchStats = async () => {
    try {
      const res = await jobApi.getStats();
      setStats(res.data);
    } catch (err) { /* silent */ }
  };

  useEffect(() => { fetchJobs(1); }, [isAnalyzedFilter, workMode, jobType, country, source]);
  useEffect(() => { fetchStats(); }, []);

  // ── Handlers ──
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await jobApi.syncJobs(selectedPlatforms);
      alert(res.data.message);
      setShowSyncOptions(false);
      fetchJobs(1);
      fetchStats();
    } catch (error) {
      alert('Failed to sync. Is backend running?');
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyze = async (job) => {
    setAnalyzingId(job._id);
    try {
      const res = await jobApi.analyzeJob(job._id);
      setJobs(prev => prev.map(j => j._id === job._id ? res.data.job : j));
      setSelectedJob(res.data.job);
      fetchStats();
    } catch (error) {
      alert('AI analysis failed. Check server logs or ensure GEMINI_API_KEY is set.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job listing?')) return;
    try {
      await jobApi.deleteJob(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      setTotal(prev => prev - 1);
    } catch (error) {
      alert('Failed to delete job');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ This will permanently remove ALL synced jobs from your database. Are you sure?')) return;
    try {
      const res = await jobApi.resetAll();
      alert(res.data.message);
      setJobs([]);
      setTotal(0);
      setTotalPages(0);
      setPage(1);
      fetchStats();
    } catch (error) {
      alert('Failed to reset.');
    }
  };

  const handleMarkApplied = async (job) => {
    try {
      await jobApi.markApplied(job._id);
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, hasApplied: true, appliedAt: new Date() } : j));
    } catch (err) {
      alert('Failed to mark as applied');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setIsAnalyzedFilter('');
    setWorkMode('');
    setJobType('');
    setCountry('');
    setSource('');
    fetchJobs(1);
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Source label helper
  const sourceLabel = (s) => {
    const map = { remotive: '🟢 Remotive', arbeitnow: '🔵 Arbeitnow', jobicy: '🟠 Jobicy', adzuna: '🟣 Adzuna', jsearch: '🔴 JSearch' };
    return map[s] || s;
  };

  const workModeLabel = (w) => {
    const map = { remote: '🏠 Remote', hybrid: '🔄 Hybrid', onsite: '🏢 Onsite' };
    return map[w] || w || '—';
  };

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>AI Job Matcher</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>
            {stats.totalJobs} jobs synced • {stats.analyzedJobs} analyzed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-danger" onClick={handleReset} style={{ fontSize: '13px' }}>
            🗑 Reset All
          </button>
          <button className="btn btn-primary" onClick={() => setShowSyncOptions(prev => !prev)} disabled={syncing}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync Jobs'}
          </button>
        </div>
      </div>

      {/* Platform Selection Panel */}
      {showSyncOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '14px' }}>Select Platforms to Sync From:</h3>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
            {PLATFORMS.map(p => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                background: selectedPlatforms.includes(p.id) ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${selectedPlatforms.includes(p.id) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '13px'
              }}>
                <input type="checkbox" checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
                <div>
                  <div style={{ fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing || selectedPlatforms.length === 0}>
              {syncing ? '⟳ Syncing...' : `Sync from ${selectedPlatforms.length} platform(s)`}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSyncOptions(false)}>Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-md)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Title or company..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 140px' }}>
            <label className="form-label">Work Mode</label>
            <select className="form-input" value={workMode} onChange={e => setWorkMode(e.target.value)}>
              {WORK_MODES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 160px' }}>
            <label className="form-label">Job Type</label>
            <select className="form-input" value={jobType} onChange={e => setJobType(e.target.value)}>
              {JOB_TYPES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 140px' }}>
            <label className="form-label">Country</label>
            <select className="form-input" value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">All Countries</option>
              {stats.countries.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 140px' }}>
            <label className="form-label">Platform</label>
            <select className="form-input" value={source} onChange={e => setSource(e.target.value)}>
              <option value="">All Platforms</option>
              {stats.sources.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 120px' }}>
            <label className="form-label">AI Status</label>
            <select className="form-input" value={isAnalyzedFilter} onChange={e => setIsAnalyzedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Analyzed</option>
              <option value="false">Pending</option>
            </select>
          </div>
          <button type="submit" className="btn btn-secondary" style={{ height: 38 }}>Search</button>
          <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ height: 38 }}>Reset Filters</button>
        </form>

        {/* Record count + Pagination header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Showing {jobs.length} of {total} records (Page {page} of {totalPages || 1})</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(page - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(page + 1)}>Next →</button>
          </div>
        </div>

        {/* Table */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Job Title / Company</th>
              <th>Location / Mode</th>
              <th>Type</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading jobs...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No jobs found. Click "Sync Jobs" to fetch listings.</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job._id} style={job.hasApplied ? { opacity: 0.6 } : {}}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.company}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{job.country || job.location || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-accent)' }}>{workModeLabel(job.workMode)}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                      {(job.jobType || '').replace('_', '-')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>{sourceLabel(job.source)}</span>
                  </td>
                  <td>
                    {job.hasApplied ? (
                      <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600 }}>
                        ✅ Applied
                      </span>
                    ) : job.isAnalyzed ? (
                      <span style={{
                        background: job.matchScore > 75 ? 'rgba(16,185,129,0.2)' : job.matchScore > 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: job.matchScore > 75 ? '#10b981' : job.matchScore > 50 ? '#f59e0b' : '#ef4444',
                        padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600
                      }}>
                        {job.matchScore}% Match
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {job.isAnalyzed ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(job)}>View Report</button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAnalyze(job)} disabled={analyzingId === job._id}>
                          {analyzingId === job._id ? '⟳...' : '✨ Match'}
                        </button>
                      )}
                      {!job.hasApplied && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleMarkApplied(job)} title="Mark as applied">📝</button>
                      )}
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Apply ↗</a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job._id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(1)}>First</button>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(page - 1)}>← Prev</button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(page + 1)}>Next →</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(totalPages)}>Last</button>
          </div>
        )}
      </div>

      {/* AI Recommendation Modal */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="AI Tailoring Strategy">
        {selectedJob && (
          <div style={{ padding: '0 var(--space-md)' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ marginBottom: 4 }}>{selectedJob.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                {selectedJob.company} • {selectedJob.country || selectedJob.location} • {workModeLabel(selectedJob.workMode)}
              </p>
              {/* Score Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-md)',
                background: selectedJob.matchScore > 75 ? 'rgba(16,185,129,0.15)' : selectedJob.matchScore > 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '18px',
                color: selectedJob.matchScore > 75 ? '#10b981' : selectedJob.matchScore > 50 ? '#f59e0b' : '#ef4444'
              }}>
                Your Current Score: {selectedJob.matchScore}%
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 6 }}>
                Source: {sourceLabel(selectedJob.source)} • Published: {selectedJob.publishedAt ? new Date(selectedJob.publishedAt).toLocaleDateString() : '—'}
              </p>
            </div>

            {/* AI Content */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              maxHeight: '50vh',
              overflowY: 'auto'
            }}>
              {selectedJob.aiRecommendation}
            </div>

            {/* Footer */}
            <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
              {!selectedJob.hasApplied && (
                <button className="btn btn-secondary" onClick={() => { handleMarkApplied(selectedJob); setSelectedJob({ ...selectedJob, hasApplied: true }); }}>
                  📝 Mark as Applied
                </button>
              )}
              <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Apply Now →</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
