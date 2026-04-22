import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function QuickMatcher() {
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSaveToTracker = async () => {
    try {
      setLoading(true);
      const payload = {
        ...result.job,
        isAnalyzed: true,
        matchScore: result.analysis.matchScore,
        aiRecommendation: result.analysis.recommendation,
        aiProvider: result.analysis.provider,
        matchedSkills: result.analysis.matchedSkills,
        missingSkills: result.analysis.missingSkills,
        source: 'custom_url',
        status: 'saved',
        hasApplied: false
      };
      const res = await api.post('/jobs/custom', payload);
      navigate('/admin/cv-generator', { state: { jobId: res.data._id } });
    } catch (err) {
      alert('Failed to save job to tracker: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!url.trim() && !rawText.trim()) return alert('Please enter a URL or Raw Text.');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/jobs/scrape', { url, rawText });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Scrape failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Quick Job Matcher</h1>
        <p style={{ color: 'var(--text-muted)' }}>Paste any Job URL to let AI scrape, translate, and score against your profile.</p>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr' }}>
        <motion.div className="admin-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>1. Provide Job Data</h3>
          
          <div className="form-group">
            <label className="form-label">🌐 Job Posting URL</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://linkedin.com/jobs/..." 
              value={url} 
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div style={{ margin: 'var(--space-md) 0', textAlign: 'center', color: 'var(--text-muted)' }}>OR / AND</div>

          <div className="form-group">
            <label className="form-label">📝 Raw Description Fallback (If URL is blocked)</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste the raw text of the job description here..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              style={{ minHeight: '300px' }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--space-md)' }} 
            onClick={handleMatch}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : '🧠 Match Job Now'}
          </button>
        </motion.div>

        <motion.div className="admin-chart-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Analysis Result</h3>
          
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-muted)' }}>
              Waiting for analysis...
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
              <div className="loader" style={{ margin: '0 auto', borderColor: 'var(--accent-primary) transparent var(--accent-primary) transparent' }} />
              <p style={{ marginTop: 'var(--space-md)' }}>Scraping and running AI logic...</p>
            </div>
          )}

          {result && (
            <div className="analysis-result fade-in">
              <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ 
                  width: 100, height: 100, 
                  borderRadius: '50%', 
                  background: `conic-gradient(var(--accent-primary) ${result.analysis.matchScore}%, var(--bg-secondary) 0)` 
                }} className="match-circle">
                  <span>{result.analysis.matchScore}%</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>{result.job.title}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>🏢 {result.job.company}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzed by: {result.analysis.provider}</p>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 212, 255, 0.05)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>📝 AI Recommendation & Missing Demands</label>
                <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {result.analysis.recommendation}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-green)', marginBottom: 'var(--space-sm)' }}>✓ Matched Skills</h4>
                  {result.analysis.matchedSkills.map(s => <div key={s}>• {s}</div>)}
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent-rose)', marginBottom: 'var(--space-sm)' }}>✕ Missing Skills</h4>
                  {result.analysis.missingSkills.map(s => <div key={s}>• {s}</div>)}
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleSaveToTracker}
                  disabled={loading}
                >
                  🚀 Save to Tracker & Generate CV
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
