import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import { jobApi } from '../../api/jobsApi';

const PLATFORMS = [
  { id: 'remotive', label: 'Remotive', desc: 'Remote tech jobs worldwide (no key)' },
  { id: 'arbeitnow', label: 'Arbeitnow', desc: 'Europe & Germany jobs (no key)' },
  { id: 'jobicy', label: 'Jobicy', desc: 'Remote jobs, all industries (no key)' },
  { id: 'adzuna', label: 'Adzuna', desc: 'DE/UK/US/AT — needs free key' },
  { id: 'jsearch', label: 'Google Jobs (JSearch)', desc: 'Google Jobs + LinkedIn + Indeed (RapidAPI key)' },
  { id: 'themuse', label: 'The Muse', desc: 'General & tech roles (no key)' }
];

const WORK_MODES = [
  { value: '', label: 'All Modes' }, { value: 'remote', label: '🏠 Remote' },
  { value: 'hybrid', label: '🔄 Hybrid' }, { value: 'onsite', label: '🏢 Onsite' }
];

const JOB_TYPES = [
  { value: '', label: 'All Types' }, { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' }, { value: 'contract', label: 'Contract' },
  { value: 'mini_job', label: 'Mini Job' }, { value: 'internship', label: 'Internship' }
];

const PAGE_SIZE = 20;

// Skeleton row component
const SkeletonRows = ({ count = 5 }) => (
  Array.from({ length: count }).map((_, i) => (
    <tr key={`skel-${i}`}>
      <td><div className="skeleton skeleton-text" style={{ width: `${70 + Math.random() * 30}%` }} /><div className="skeleton skeleton-text-sm" style={{ width: '50%' }} /></td>
      <td><div className="skeleton skeleton-text-sm" style={{ width: '70%' }} /><div className="skeleton skeleton-text-xs" /></td>
      <td><div className="skeleton skeleton-badge" style={{ width: 32, height: 22 }} /></td>
      <td><div className="skeleton skeleton-text-sm" style={{ width: '80%' }} /></td>
      <td><div className="skeleton skeleton-badge" /></td>
      <td><div style={{ display: 'flex', gap: 4 }}><div className="skeleton skeleton-btn" /><div className="skeleton skeleton-btn" style={{ width: 40 }} /></div></td>
    </tr>
  ))
);

// Job type abbreviation
const jobTypeLabel = (t) => {
  const map = { full_time: 'F', part_time: 'P', contract: 'C', internship: 'I', mini_job: 'M' };
  const tipMap = { full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract', internship: 'Internship', mini_job: 'Mini Job' };
  return <span title={tipMap[t] || t} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{map[t] || t || '—'}</span>;
};

export default function JobMatcher() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const [search, setSearch] = useState('');
  const [isAnalyzedFilter, setIsAnalyzedFilter] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobType, setJobType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [source, setSource] = useState('');

  const [selectedPlatforms, setSelectedPlatforms] = useState(['remotive', 'arbeitnow', 'jobicy']);
  const [showSyncOptions, setShowSyncOptions] = useState(false);

  const [stats, setStats] = useState({ sources: [], countries: [], totalJobs: 0, analyzedJobs: 0 });

  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (isAnalyzedFilter) params.isAnalyzed = isAnalyzedFilter;
      if (workMode) params.workMode = workMode;
      if (jobType) params.jobType = jobType;
      if (country) params.country = country;
      if (filterLocation) params.location = filterLocation;
      if (filterLanguage) params.language = filterLanguage;
      if (source) params.source = source;
      const res = await jobApi.getJobs(params);
      setJobs(res.data.jobs); setTotal(res.data.total);
      setTotalPages(res.data.totalPages); setPage(res.data.page);
    } catch (error) { console.error('Failed to fetch jobs', error); }
    finally { setLoading(false); }
  }, [search, isAnalyzedFilter, workMode, jobType, country, filterLocation, filterLanguage, source]);

  const fetchStats = async () => { try { const res = await jobApi.getStats(); setStats(res.data); } catch (e) {} };

  useEffect(() => { fetchJobs(1); }, [isAnalyzedFilter, workMode, jobType, country, filterLocation, filterLanguage, source]);
  useEffect(() => { fetchStats(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await jobApi.syncJobs(selectedPlatforms, search.trim(), filterLocation.trim(), filterLanguage, jobType);
      alert(res.data.message);
      setShowSyncOptions(false);
      fetchJobs(1);
      fetchStats();
    } catch (error) { alert('Failed to sync. Is backend running?'); }
    finally { setSyncing(false); }
  };

  const handleAnalyze = async (job) => {
    setAnalyzingId(job._id);
    try {
      const res = await jobApi.analyzeJob(job._id);
      setJobs(prev => prev.map(j => j._id === job._id ? res.data.job : j));
      setSelectedJob(res.data.job);
      fetchStats();
    } catch (error) { alert('AI analysis failed. Check server logs.'); }
    finally { setAnalyzingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job listing?')) return;
    try { await jobApi.deleteJob(id); setJobs(prev => prev.filter(j => j._id !== id)); setTotal(prev => prev - 1); }
    catch (error) { alert('Failed to delete'); }
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ Remove all non-applied jobs? Applied jobs will be preserved.')) return;
    try { const res = await jobApi.resetAll(); alert(res.data.message); fetchJobs(1); fetchStats(); }
    catch (error) { alert('Failed to reset.'); }
  };

  const handleMarkApplied = async (job) => {
    try { await jobApi.markApplied(job._id); setJobs(prev => prev.map(j => j._id === job._id ? { ...j, hasApplied: true, appliedAt: new Date() } : j)); }
    catch (err) { alert('Failed'); }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchJobs(1); };
  const handleResetFilters = () => { setSearch(''); setIsAnalyzedFilter(''); setWorkMode(''); setJobType(''); setCountry(''); setFilterLocation(''); setFilterLanguage(''); setSource(''); fetchJobs(1); };
  const togglePlatform = (id) => { setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]); };

  const sourceLabel = (s) => ({ remotive: '🟢 Remotive', arbeitnow: '🔵 Arbeitnow', jobicy: '🟠 Jobicy', adzuna: '🟣 Adzuna', jsearch: '🔴 JSearch' }[s] || s);
  const workModeLabel = (w) => ({ remote: '🏠 Remote', hybrid: '🔄 Hybrid', onsite: '🏢 Onsite' }[w] || w || '—');
  const providerBadge = (p) => {
    const map = { gemini: { l: '✨ Gemini', c: '#8b5cf6' }, huggingface: { l: '🤗 HF', c: '#f59e0b' }, groq: { l: '🚀 Groq', c: '#10b981' }, fallback: { l: '⚠️ Fallback', c: '#ef4444' } };
    const i = map[p]; return i ? <span style={{ fontSize: '11px', color: i.c, fontWeight: 600, background: `${i.c}20`, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>{i.l}</span> : null;
  };
  const langBadge = (lang) => lang && lang !== 'english' ? <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 5px', borderRadius: 3, fontWeight: 500 }}>🇩🇪 DE</span> : null;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>AI Job Matcher</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>{stats.totalJobs} jobs synced • {stats.analyzedJobs} analyzed</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-danger" onClick={handleReset} style={{ fontSize: '13px' }}>🗑 Reset All</button>
          <button className="btn btn-primary" onClick={() => setShowSyncOptions(prev => !prev)} disabled={syncing}>
            {syncing ? '⟳ Syncing...' : '⟳ Sync Jobs'}
          </button>
        </div>
      </div>

      {/* Sync Panel with Search Query */}
      {showSyncOptions && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', position: 'relative' }}>

          {/* Sync loading overlay */}
          {syncing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 'var(--space-md)' }}>
              <div className="loader" style={{ width: 40, height: 40 }} />
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Syncing...</div>
            </div>
          )}

          <div style={{ marginBottom: 'var(--space-md)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
            <strong>Note:</strong> Sync uses your active Table Filters below to grab specifically matched jobs! Currently configured to search for: <br/>
            <span style={{ fontWeight: 600, color: 'var(--text-accent)', display: 'inline-block', marginTop: 4 }}>
              {` Role: "${search || 'All'}" • City: "${filterLocation || 'All'}" • Lang: "${filterLanguage || 'All'}" • Type: "${JOB_TYPES.find(j=>j.value===jobType)?.label || 'All'}"`}
            </span>
          </div>

          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '14px' }}>Select Platforms:</h3>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
            {PLATFORMS.map(p => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)',
                background: selectedPlatforms.includes(p.id) ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${selectedPlatforms.includes(p.id) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '13px'
              }}>
                <input type="checkbox" checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
                <div><div style={{ fontWeight: 600 }}>{p.label}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div></div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing || selectedPlatforms.length === 0}>
              {syncing ? '⟳ Syncing...' : `Sync Using Filters (${selectedPlatforms.length} platforms)`}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSyncOptions(false)}>Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-md)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}><label className="form-label">Role Search</label><input className="form-input" placeholder="Title or company..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}><label className="form-label">Location / City</label><input className="form-input" placeholder='e.g. "Bremen"' value={filterLocation} onChange={e => setFilterLocation(e.target.value)} /></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 120px' }}><label className="form-label">Language</label><select className="form-input" value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)}><option value="">All</option><option value="english">English</option><option value="german">German</option></select></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 120px' }}><label className="form-label">Job Type</label><select className="form-input" value={jobType} onChange={e => setJobType(e.target.value)}>{JOB_TYPES.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}</select></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 120px' }}><label className="form-label">Work Mode</label><select className="form-input" value={workMode} onChange={e => setWorkMode(e.target.value)}>{WORK_MODES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</select></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 120px' }}><label className="form-label">Platform</label><select className="form-input" value={source} onChange={e => setSource(e.target.value)}><option value="">All</option>{stats.sources.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 100px' }}><label className="form-label">AI Match</label><select className="form-input" value={isAnalyzedFilter} onChange={e => setIsAnalyzedFilter(e.target.value)}><option value="">All</option><option value="true">Analyzed</option><option value="false">Pending</option></select></div>
          <button type="submit" className="btn btn-secondary" style={{ height: 38 }}>Search</button>
          <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ height: 38 }}>Reset</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>{jobs.length} of {total} (Page {page}/{totalPages || 1})</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(page - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(page + 1)}>Next →</button>
          </div>
        </div>

        <table className="admin-table">
          <thead><tr><th>Job / Company</th><th>Location</th><th>Type</th><th>Platform</th><th>Match</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <SkeletonRows count={8} /> : jobs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No jobs. Click "Sync Jobs" and enter a role to search.</td></tr>
            ) : jobs.map(job => (
              <tr key={job._id} style={job.hasApplied ? { opacity: 0.6 } : {}}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{job.title}</span>
                    {langBadge(job.language)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.company}</div>
                </td>
                <td><div style={{ fontSize: '13px', lineHeight: 1.4 }}>{!job.location ? (job.country || '—') : (!job.country ? job.location : (job.location.toLowerCase().includes(job.country.toLowerCase()) ? job.location : `${job.location}, ${job.country}`))}</div><div style={{ fontSize: '11px', color: 'var(--text-accent)', marginTop: 2 }}>{workModeLabel(job.workMode)}</div></td>
                <td>{jobTypeLabel(job.jobType)}</td>
                <td><span style={{ fontSize: '12px' }}>{sourceLabel(job.source)}</span></td>
                <td>
                  {job.hasApplied ? (
                    <span style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600 }}>✅ Applied</span>
                  ) : job.isAnalyzed ? (
                    <div>
                      <span style={{
                        background: job.matchScore > 75 ? 'rgba(16,185,129,0.2)' : job.matchScore > 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: job.matchScore > 75 ? '#10b981' : job.matchScore > 50 ? '#f59e0b' : '#ef4444',
                        padding: '4px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600
                      }}>{job.matchScore}%</span>
                      {providerBadge(job.aiProvider)}
                    </div>
                  ) : analyzingId === job._id ? (
                    <div className="skeleton skeleton-badge" />
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}>Pending</span>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    {job.isAnalyzed ? (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(job)}>Report</button>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/cv-generator?jobId=${job._id}`)} title="Generate tailored CV">📄 CV</button>
                      </>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleAnalyze(job)} disabled={analyzingId === job._id}>
                        {analyzingId === job._id ? <><div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }} /> Analyzing...</> : '✨ Match'}
                      </button>
                    )}
                    {!job.hasApplied && <button className="btn btn-secondary btn-sm" onClick={() => handleMarkApplied(job)} title="Mark applied">📝</button>}
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">↗</a>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job._id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(1)}>First</button>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchJobs(page - 1)}>← Prev</button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(page + 1)}>Next →</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchJobs(totalPages)}>Last</button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="AI Tailoring Strategy">
        {selectedJob && (
          <div style={{ padding: '0 var(--space-md)' }}>
            <div style={{ marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ margin: 0 }}>{selectedJob.title}</h2>
                {langBadge(selectedJob.language)}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                {selectedJob.company} • {!selectedJob.location ? (selectedJob.country || '—') : (!selectedJob.country ? selectedJob.location : (selectedJob.location.toLowerCase().includes(selectedJob.country.toLowerCase()) ? selectedJob.location : `${selectedJob.location}, ${selectedJob.country}`))} • {workModeLabel(selectedJob.workMode)}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: selectedJob.matchScore > 75 ? 'rgba(16,185,129,0.15)' : selectedJob.matchScore > 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '18px',
                  color: selectedJob.matchScore > 75 ? '#10b981' : selectedJob.matchScore > 50 ? '#f59e0b' : '#ef4444'
                }}>Match: {selectedJob.matchScore}%</div>
                {providerBadge(selectedJob.aiProvider)}
              </div>
              {(selectedJob.matchedSkills?.length > 0 || selectedJob.missingSkills?.length > 0) && (
                <div style={{ display: 'flex', gap: 16, marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                  {selectedJob.matchedSkills?.length > 0 && <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>✅ Matched:</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{selectedJob.matchedSkills.map((s, i) => <span key={i} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 6px', borderRadius: 3, fontSize: '10px' }}>{s}</span>)}</div></div>}
                  {selectedJob.missingSkills?.length > 0 && <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>⚠️ Missing:</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{selectedJob.missingSkills.map((s, i) => <span key={i} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: 3, fontSize: '10px' }}>{s}</span>)}</div></div>}
                </div>
              )}
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '14px', maxHeight: '50vh', overflowY: 'auto' }}>
              {selectedJob.aiRecommendation}
            </div>
            <div className="modal-actions" style={{ marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setSelectedJob(null); navigate(`/admin/cv-generator?jobId=${selectedJob._id}`); }}>
                📄 Generate Tailored CV
              </button>
              {!selectedJob.hasApplied && (
                <button className="btn btn-secondary" onClick={() => { handleMarkApplied(selectedJob); setSelectedJob({ ...selectedJob, hasApplied: true }); }}>📝 Mark Applied</button>
              )}
              <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Apply ↗</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
