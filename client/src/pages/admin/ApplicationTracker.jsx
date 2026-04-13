import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Modal from '../../components/Modal';
import { jobApi } from '../../api/jobsApi';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { value: 'followedup', label: 'Followed Up', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'confirmed', label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { value: 'on_hold', label: 'On Hold', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
];

const PAGE_SIZE = 20;

// Skeleton rows
const SkeletonRows = ({ count = 5 }) => (
  Array.from({ length: count }).map((_, i) => (
    <tr key={`skel-${i}`}>
      <td><div className="skeleton skeleton-text" style={{ width: `${60 + Math.random() * 30}%` }} /><div className="skeleton skeleton-text-sm" /></td>
      <td><div className="skeleton skeleton-text-sm" style={{ width: '70%' }} /></td>
      <td><div className="skeleton skeleton-badge" style={{ width: 50 }} /></td>
      <td><div className="skeleton skeleton-badge" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text-sm" style={{ width: '30px' }} /></td>
      <td><div style={{ display: 'flex', gap: 4 }}><div className="skeleton skeleton-btn" /><div className="skeleton skeleton-btn" style={{ width: 32 }} /></div></td>
    </tr>
  ))
);

// Skeleton cards
const SkeletonStats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="skeleton-card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%', margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: 40, height: 28, margin: '0 auto 8px' }} />
        <div className="skeleton skeleton-text-sm" style={{ width: '70%', margin: '0 auto' }} />
      </div>
    ))}
  </div>
);

export default function ApplicationTracker() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [notesModal, setNotesModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchApplied = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await jobApi.getApplied(params);
      setJobs(res.data.jobs); setTotal(res.data.total);
      setTotalPages(res.data.totalPages); setPage(res.data.page);
    } catch (err) { console.error('Failed to fetch', err); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try { const res = await jobApi.getStats(); setStats(res.data); }
    catch (err) { /* silent */ }
    finally { setStatsLoading(false); }
  };

  useEffect(() => { fetchApplied(1); }, [statusFilter]);
  useEffect(() => { fetchStats(); }, []);

  const handleStatusChange = async (job, newStatus) => {
    try { const res = await jobApi.updateStatus(job._id, newStatus); setJobs(prev => prev.map(j => j._id === job._id ? res.data.job : j)); fetchStats(); }
    catch (err) { alert('Failed to update status'); }
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    setSavingNotes(true);
    try { const res = await jobApi.updateNotes(notesModal.job._id, notesModal.notes); setJobs(prev => prev.map(j => j._id === notesModal.job._id ? res.data.job : j)); setNotesModal(null); }
    catch (err) { alert('Failed to save notes'); }
    finally { setSavingNotes(false); }
  };

  const handleContactEmailSave = async (job, email) => {
    try { await jobApi.updateContactEmail(job._id, email); setJobs(prev => prev.map(j => j._id === job._id ? { ...j, contactEmail: email } : j)); }
    catch (err) { alert('Failed to save email'); }
  };

  const handleSendFollowUp = async (job) => {
    if (!job.contactEmail) { setEmailModal({ job, email: '', preview: null, step: 'email' }); return; }
    setSendingEmail(true);
    try {
      const res = await jobApi.sendFollowUp(job._id);
      setEmailModal({ job, email: job.contactEmail, preview: res.data.emailPreview, step: 'preview', manualMode: res.data.manualMode });
      if (!res.data.manualMode) { setJobs(prev => prev.map(j => j._id === job._id ? res.data.job : j)); fetchStats(); }
    } catch (err) { alert('Failed to generate email'); }
    finally { setSendingEmail(false); }
  };

  const handleEmailModalSubmit = async () => {
    if (emailModal.step === 'email') {
      await handleContactEmailSave(emailModal.job, emailModal.email);
      const updatedJob = { ...emailModal.job, contactEmail: emailModal.email };
      setEmailModal(null);
      handleSendFollowUp(updatedJob);
    } else { setEmailModal(null); }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchApplied(1); };
  const getStatusOption = (val) => STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0];

  const appliedCount = stats?.statusCounts?.applied || 0;
  const followedUpCount = stats?.statusCounts?.followedup || 0;
  const confirmedCount = stats?.statusCounts?.confirmed || 0;
  const rejectedCount = stats?.statusCounts?.rejected || 0;
  const onHoldCount = stats?.statusCounts?.on_hold || 0;
  const totalApplied = stats?.appliedJobs || 0;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Application Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>Track and manage all your job applications</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? <SkeletonStats /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          {[
            { label: 'Total Applied', value: totalApplied, color: '#8b5cf6', icon: '📊' },
            { label: 'Applied', value: appliedCount, color: '#3b82f6', icon: '📤' },
            { label: 'Followed Up', value: followedUpCount, color: '#f59e0b', icon: '📧' },
            { label: 'Confirmed', value: confirmedCount, color: '#10b981', icon: '✅' },
            { label: 'Rejected', value: rejectedCount, color: '#ef4444', icon: '❌' },
            { label: 'On Hold', value: onHoldCount, color: '#6b7280', icon: '⏸️' }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chart */}
      {stats?.appsOverTime?.length > 0 && (
        <motion.div className="admin-chart-card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-lg)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 600, fontSize: '14px' }}>Applications Over Time (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.appsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Filters + Table */}
      <div className="admin-table-card">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}><label className="form-label">Search</label><input className="form-input" placeholder="Company or title..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="form-group" style={{ margin: 0, flex: '0 1 160px' }}><label className="form-label">Status</label><select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All</option>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <button type="submit" className="btn btn-secondary" style={{ height: 38 }}>Search</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); fetchApplied(1); }} style={{ height: 38 }}>Reset</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>{jobs.length} of {total} (Page {page}/{totalPages || 1})</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchApplied(page - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchApplied(page + 1)}>Next →</button>
          </div>
        </div>

        <table className="admin-table">
          <thead><tr><th>Job / Company</th><th>Applied</th><th>Match</th><th>Status</th><th>Follow-Ups</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <SkeletonRows count={6} /> : jobs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No applications. Mark jobs as "Applied" in the Job Matcher.</td></tr>
            ) : jobs.map(job => {
              const st = getStatusOption(job.applicationStatus);
              return (
                <tr key={job._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.company}</div>
                    {job.contactEmail && <div style={{ fontSize: '11px', color: 'var(--text-accent)', marginTop: 2 }}>📧 {job.contactEmail}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{job.appliedAt ? `${Math.floor((Date.now() - new Date(job.appliedAt)) / 86400000)}d ago` : ''}</div>
                  </td>
                  <td>
                    {job.matchScore != null ? (
                      <span style={{ background: job.matchScore > 75 ? 'rgba(16,185,129,0.2)' : job.matchScore > 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: job.matchScore > 75 ? '#10b981' : job.matchScore > 50 ? '#f59e0b' : '#ef4444', padding: '3px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600 }}>{job.matchScore}%</span>
                    ) : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <select value={job.applicationStatus || 'applied'} onChange={e => handleStatusChange(job, e.target.value)}
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30`, borderRadius: 6, padding: '4px 8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{job.followUpCount || 0}</div>
                    {job.lastFollowUpAt && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Last: {new Date(job.lastFollowUpAt).toLocaleDateString()}</div>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSendFollowUp(job)} disabled={sendingEmail} title="Follow-up email">
                        {sendingEmail ? <><div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }} /> Sending...</> : '✉️ Follow Up'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setNotesModal({ job, notes: job.applicationNotes || '' })} title="Notes">📝</button>
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="View listing">↗</a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchApplied(1)}>First</button>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchApplied(page - 1)}>← Prev</button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchApplied(page + 1)}>Next →</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchApplied(totalPages)}>Last</button>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Application Notes">
        {notesModal && (
          <div style={{ padding: '0 var(--space-md)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>{notesModal.job.title} at {notesModal.job.company}</p>
            <textarea className="form-textarea" value={notesModal.notes} onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })} placeholder="Notes, feedback, contacts..." style={{ minHeight: 150 }} />
            <div className="modal-actions" style={{ marginTop: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={() => setNotesModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveNotes} disabled={savingNotes}>{savingNotes ? 'Saving...' : 'Save Notes'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={!!emailModal} onClose={() => setEmailModal(null)} title={emailModal?.step === 'email' ? 'Set Contact Email' : 'Follow-Up Email'}>
        {emailModal && emailModal.step === 'email' && (
          <div style={{ padding: '0 var(--space-md)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Enter HR/recruiter email for: <strong>{emailModal.job.title}</strong> at <strong>{emailModal.job.company}</strong></p>
            <input className="form-input" type="email" placeholder="hr@company.com" value={emailModal.email} onChange={e => setEmailModal({ ...emailModal, email: e.target.value })} />
            <div className="modal-actions" style={{ marginTop: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={() => setEmailModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEmailModalSubmit} disabled={!emailModal.email}>Save & Generate Email</button>
            </div>
          </div>
        )}
        {emailModal && emailModal.step === 'preview' && emailModal.preview && (
          <div style={{ padding: '0 var(--space-md)' }}>
            {emailModal.manualMode ? (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: '13px' }}>
                ⚠️ SMTP not configured. Copy and send manually. Set up SMTP in .env to auto-send.
              </div>
            ) : (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: '13px', color: '#10b981' }}>
                ✅ Email sent to {emailModal.email}!
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TO:</label>
              <div style={{ fontSize: '14px' }}>{emailModal.email}</div>
            </div>
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SUBJECT:</label>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{emailModal.preview.subject}</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.7, maxHeight: '40vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
              {emailModal.preview.body}
            </div>
            <div className="modal-actions" style={{ marginTop: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={() => setEmailModal(null)}>Close</button>
              <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(`Subject: ${emailModal.preview.subject}\n\n${emailModal.preview.body}`); alert('Copied!'); }}>📋 Copy</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
