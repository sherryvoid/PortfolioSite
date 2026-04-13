import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobApi } from '../../api/jobsApi';

// ─── 6 Templates ─────────────────────────────────────────────
const TEMPLATES = [
  { id: 'modern', label: '🎨 Modern', desc: 'Sidebar layout' },
  { id: 'classic', label: '📄 Classic', desc: 'ATS-optimized' },
  { id: 'minimal', label: '✨ Minimal', desc: 'Clean & light' },
  { id: 'executive', label: '👔 Executive', desc: 'Two-column pro' },
  { id: 'creative', label: '🌈 Creative', desc: 'Bold & modern' },
  { id: 'tech', label: '💻 Tech', desc: 'Dev-focused' }
];

const DEFAULT_COLORS = {
  modern: { primary: '#2563eb', accent: '#dbeafe' },
  classic: { primary: '#111827', accent: '#f3f4f6' },
  minimal: { primary: '#0f172a', accent: '#f8fafc' },
  executive: { primary: '#1e3a5f', accent: '#e8f0fe' },
  creative: { primary: '#7c3aed', accent: '#f3e8ff' },
  tech: { primary: '#059669', accent: '#ecfdf5' }
};

// ─── Skeleton ────────────────────────────────────────────────
function CVSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
      <div>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" style={{ marginBottom: 'var(--space-md)' }}><div className="skeleton skeleton-text" style={{ width: '40%', height: 16, marginBottom: 12 }} /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width: '75%' }} /></div>)}</div>
      <div className="skeleton-card" style={{ aspectRatio: '210/297' }}><div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} /></div>
    </div>
  );
}

// ─── Editor Section Card ─────────────────────────────────────
function EditorCard({ title, icon, children, delay = 0 }) {
  return (
    <motion.div className="admin-chart-card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-lg)' }}
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ─── Full-width Input ────────────────────────────────────────
function FullInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ marginBottom: 'var(--space-sm)' }}>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 3 }}>{label}</label>
      <input className="form-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }} />
    </div>
  );
}

// ─── CV Preview Render ───────────────────────────────────────
function CVPreview({ data, template, colors, showPhoto }) {
  if (!data) return null;
  const c = colors;
  const p = data.personalInfo || {};
  const photo = showPhoto && data.cvPhoto;

  const headerBlock = (align = 'left') => (
    <div style={{ textAlign: align, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: align === 'center' ? 'center' : 'flex-start', justifyContent: align, gap: 14 }}>
        {photo && <img src={photo} alt="CV" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c.primary}` }} />}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: c.primary, margin: 0, lineHeight: 1.2 }}>{p.name || 'Your Name'}</h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{p.title || 'Developer'}</p>
        </div>
      </div>
      <div style={{ fontSize: '10px', color: '#6b7280', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        {p.email && <span>📧 {p.email}</span>}{p.phone && <span>📱 {p.phone}</span>}{p.location && <span>📍 {p.location}</span>}
      </div>
    </div>
  );

  const sectionTitle = (title, brd = c.primary) => (
    <h2 style={{ fontSize: '12px', fontWeight: 700, color: c.primary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, paddingBottom: 3, borderBottom: `2px solid ${brd}` }}>{title}</h2>
  );

  const skillPills = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {(data.highlightedSkills || []).map((s, i) => <span key={i} style={{ background: c.accent, padding: '2px 7px', borderRadius: 3, fontSize: '9px', color: c.primary, fontWeight: 500 }}>{s}</span>)}
    </div>
  );

  const expBlocks = () => (data.experienceBullets || []).map((exp, i) => (
    <div key={i} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: '11px' }}>{exp.role}</span><span style={{ fontSize: '9px', color: '#6b7280' }}>{exp.duration}</span></div>
      <div style={{ fontSize: '10px', color: c.primary, fontWeight: 500, marginBottom: 2 }}>{exp.company}</div>
      <ul style={{ paddingLeft: 12, margin: 0 }}>{(exp.bullets || []).map((b, j) => <li key={j} style={{ fontSize: '9px', marginBottom: 1, color: '#374151', lineHeight: 1.4 }}>{b}</li>)}</ul>
    </div>
  ));

  const projBlocks = () => (data.relevantProjects || []).map((proj, i) => (
    <div key={i} style={{ marginBottom: 6 }}>
      <div style={{ fontWeight: 600, fontSize: '10px' }}>{proj.title}</div>
      <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: 1 }}>{proj.description}</div>
      <div style={{ fontSize: '8px', color: c.primary }}>{(proj.tech || []).join(' · ')}</div>
    </div>
  ));

  const eduBlock = () => (data.personalInfo?.education || []).map((edu, i) => (
    <div key={i} style={{ marginBottom: 4 }}><div style={{ fontWeight: 600, fontSize: '10px' }}>{edu.degree} in {edu.field}</div><div style={{ fontSize: '9px', color: '#6b7280' }}>{edu.institution} {edu.year && `(${edu.year})`}</div></div>
  ));

  const langBlock = () => (data.personalInfo?.languages || []).map((l, i) => (
    <div key={i} style={{ fontSize: '9px', marginBottom: 1 }}>{l.name}: {l.level}</div>
  ));

  const certBlock = () => (data.personalInfo?.certifications || []).map((cert, i) => (
    <div key={i} style={{ fontSize: '9px', marginBottom: 2 }}><span style={{ fontWeight: 600 }}>{cert.title}</span> — {cert.issuer}</div>
  ));

  // ── MODERN: sidebar left ──
  if (template === 'modern') {
    return (
      <div style={{ display: 'flex', fontFamily: "'Inter', sans-serif", fontSize: '10px', lineHeight: 1.45, color: '#1f2937', background: '#fff', minHeight: '100%' }}>
        <div style={{ width: '34%', background: c.primary, color: '#fff', padding: '20px 14px' }}>
          {photo && <img src={photo} alt="CV" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', margin: '0 auto 10px', display: 'block' }} />}
          <h1 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 2, color: '#fff', textAlign: 'center' }}>{p.name || 'Your Name'}</h1>
          <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: 14, textAlign: 'center' }}>{p.title || 'Developer'}</p>
          <SideSection title="Contact">{p.email && <div style={{ fontSize: '9px', marginBottom: 2 }}>📧 {p.email}</div>}{p.phone && <div style={{ fontSize: '9px', marginBottom: 2 }}>📱 {p.phone}</div>}{p.location && <div style={{ fontSize: '9px', marginBottom: 2 }}>📍 {p.location}</div>}</SideSection>
          <SideSection title="Skills"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{(data.highlightedSkills || []).map((s, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 5px', borderRadius: 3, fontSize: '8px' }}>{s}</span>)}</div></SideSection>
          {(p.languages?.length > 0) && <SideSection title="Languages">{p.languages.map((l, i) => <div key={i} style={{ fontSize: '9px', marginBottom: 1 }}>{l.name} — {l.level}</div>)}</SideSection>}
          {(p.certifications?.length > 0) && <SideSection title="Certs">{p.certifications.map((c, i) => <div key={i} style={{ fontSize: '9px', marginBottom: 3 }}><div style={{ fontWeight: 600 }}>{c.title}</div><div style={{ opacity: 0.7 }}>{c.issuer}</div></div>)}</SideSection>}
        </div>
        <div style={{ flex: 1, padding: '20px 16px' }}>
          <div style={{ marginBottom: 12 }}>{sectionTitle('Professional Summary')}<p style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>{data.professionalSummary}</p></div>
          {data.experienceBullets?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Experience')}{expBlocks()}</div>}
          {data.relevantProjects?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Key Projects')}{projBlocks()}</div>}
          {p.education?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Education')}{eduBlock()}</div>}
        </div>
      </div>
    );
  }

  // ── EXECUTIVE: two-column body ──
  if (template === 'executive') {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', lineHeight: 1.45, color: '#1f2937', background: '#fff', padding: '24px 20px', minHeight: '100%' }}>
        <div style={{ borderLeft: `4px solid ${c.primary}`, paddingLeft: 14, marginBottom: 16 }}>
          {headerBlock('left')}
        </div>
        <div style={{ marginBottom: 12 }}>{sectionTitle('Professional Summary')}<p style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>{data.professionalSummary}</p></div>
        {sectionTitle('Technical Skills')}{skillPills()}<div style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1.2 }}>
            {data.experienceBullets?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Experience')}{expBlocks()}</div>}
            {data.relevantProjects?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Key Projects')}{projBlocks()}</div>}
          </div>
          <div style={{ flex: 0.8, borderLeft: `1px solid ${c.accent}`, paddingLeft: 14 }}>
            {p.education?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Education')}{eduBlock()}</div>}
            {p.certifications?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Certifications')}{certBlock()}</div>}
            {p.languages?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Languages')}{langBlock()}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ── CREATIVE: bold header ──
  if (template === 'creative') {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', lineHeight: 1.45, color: '#1f2937', background: '#fff', minHeight: '100%' }}>
        <div style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.primary}cc)`, color: '#fff', padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {photo && <img src={photo} alt="CV" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' }} />}
          <div><h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fff' }}>{p.name || 'Your Name'}</h1><p style={{ fontSize: '12px', opacity: 0.85, margin: 0 }}>{p.title || 'Developer'}</p>
            <div style={{ fontSize: '9px', opacity: 0.7, marginTop: 4, display: 'flex', gap: 8 }}>{p.email && <span>📧 {p.email}</span>}{p.phone && <span>📱 {p.phone}</span>}{p.location && <span>📍 {p.location}</span>}</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 12 }}>{sectionTitle('About')}<p style={{ fontSize: '10px', color: '#6b7280' }}>{data.professionalSummary}</p></div>
          {sectionTitle('Skills')}{skillPills()}<div style={{ marginBottom: 12 }} />
          {data.experienceBullets?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Experience')}{expBlocks()}</div>}
          <div style={{ display: 'flex', gap: 16 }}>
            {data.relevantProjects?.length > 0 && <div style={{ flex: 1 }}>{sectionTitle('Projects')}{projBlocks()}</div>}
            <div style={{ flex: 1 }}>
              {p.education?.length > 0 && <div style={{ marginBottom: 8 }}>{sectionTitle('Education')}{eduBlock()}</div>}
              {p.certifications?.length > 0 && <div style={{ marginBottom: 8 }}>{sectionTitle('Certifications')}{certBlock()}</div>}
              {p.languages?.length > 0 && <div>{sectionTitle('Languages')}{langBlock()}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TECH: monospace accents ──
  if (template === 'tech') {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', lineHeight: 1.45, color: '#1f2937', background: '#fff', padding: '22px 20px', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, borderBottom: `2px solid ${c.primary}`, paddingBottom: 10 }}>
          {photo && <img src={photo} alt="CV" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />}
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{p.name || 'Your Name'}</h1>
            <p style={{ fontSize: '11px', color: c.primary, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>{'> '}{p.title || 'Developer'}</p>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '9px', color: '#6b7280', textAlign: 'right' }}>
            {p.email && <div>{p.email}</div>}{p.phone && <div>{p.phone}</div>}{p.location && <div>{p.location}</div>}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Summary</h2><p style={{ fontSize: '10px', color: '#6b7280' }}>{data.professionalSummary}</p></div>
        <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Tech Stack</h2>{skillPills()}</div>
        {data.experienceBullets?.length > 0 && <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Experience</h2>{expBlocks()}</div>}
        {data.relevantProjects?.length > 0 && <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Projects</h2>{projBlocks()}</div>}
        <div style={{ display: 'flex', gap: 16 }}>
          {p.education?.length > 0 && <div style={{ flex: 1 }}><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Education</h2>{eduBlock()}</div>}
          <div style={{ flex: 1 }}>
            {p.certifications?.length > 0 && <><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{'// '}Certs</h2>{certBlock()}</>}
            {p.languages?.length > 0 && <><h2 style={{ fontSize: '11px', fontWeight: 700, color: c.primary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, marginTop: 8 }}>{'// '}Languages</h2>{langBlock()}</>}
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC / MINIMAL (default) ──
  const isMinimal = template === 'minimal';
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', lineHeight: 1.45, color: '#1f2937', background: '#fff', padding: '24px 20px', minHeight: '100%' }}>
      {headerBlock(isMinimal ? 'left' : 'center')}
      {!isMinimal && <div style={{ height: 2, background: c.primary, marginBottom: 14 }} />}
      <div style={{ marginBottom: 12 }}>{sectionTitle('Professional Summary', isMinimal ? c.accent : c.primary)}<p style={{ fontSize: '10px', color: '#6b7280' }}>{data.professionalSummary}</p></div>
      {sectionTitle('Technical Skills', isMinimal ? c.accent : c.primary)}{skillPills()}<div style={{ marginBottom: 12 }} />
      {data.experienceBullets?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Experience', isMinimal ? c.accent : c.primary)}{expBlocks()}</div>}
      {data.relevantProjects?.length > 0 && <div style={{ marginBottom: 12 }}>{sectionTitle('Key Projects', isMinimal ? c.accent : c.primary)}{projBlocks()}</div>}
      <div style={{ display: 'flex', gap: 20 }}>
        {p.education?.length > 0 && <div style={{ flex: 1 }}>{sectionTitle('Education', isMinimal ? c.accent : c.primary)}{eduBlock()}</div>}
        <div style={{ flex: 1 }}>
          {p.certifications?.length > 0 && <div style={{ marginBottom: 8 }}>{sectionTitle('Certifications', isMinimal ? c.accent : c.primary)}{certBlock()}</div>}
          {p.languages?.length > 0 && <div>{sectionTitle('Languages', isMinimal ? c.accent : c.primary)}{langBlock()}</div>}
        </div>
      </div>
    </div>
  );
}

// Sidebar section helper for Modern template
function SideSection({ title, children }) {
  return <div style={{ marginBottom: 14 }}><h3 style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.65, marginBottom: 5 }}>{title}</h3>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CVGenerator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');
  const fileInputRef = useRef(null);

  // State
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [template, setTemplate] = useState('modern');
  const [colors, setColors] = useState(DEFAULT_COLORS.modern);
  const [showPhoto, setShowPhoto] = useState(true);
  const [cvPhoto, setCvPhoto] = useState('');
  const [error, setError] = useState('');

  // Editable personal info
  const [personalInfo, setPersonalInfo] = useState({ name: '', title: '', email: '', phone: '', location: '', education: [], languages: [], certifications: [] });
  const [editSummary, setEditSummary] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [editExperience, setEditExperience] = useState([]);
  const [editProjects, setEditProjects] = useState([]);
  const [jobInfo, setJobInfo] = useState(null);

  // Job picker for standalone mode
  const [analyzedJobs, setAnalyzedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId || '');

  // Fetch analyzed jobs for the picker
  useEffect(() => {
    if (!jobId) {
      jobApi.getJobs({ isAnalyzed: 'true', limit: 100 }).then(res => {
        setAnalyzedJobs(res.data.jobs || []);
      }).catch(() => {});
    }
  }, [jobId]);

  // Generate CV
  const handleGenerate = async (jId) => {
    const targetId = jId || selectedJobId;
    if (!targetId) { setError('Please select a job first'); return; }
    setLoading(true); setError('');
    try {
      const res = await jobApi.generateCV(targetId);
      const data = res.data.cvData;
      setCvData(data);
      setEditSummary(data.professionalSummary || '');
      setEditSkills(data.highlightedSkills || []);
      setEditExperience(data.experienceBullets || []);
      setEditProjects(data.relevantProjects || []);
      setJobInfo(data.targetJob || null);
      const rp = data.rawProfile || {};
      setPersonalInfo({
        name: rp.name || '', title: rp.title || '', email: rp.email || '',
        phone: rp.phone || '', location: rp.location || '',
        education: rp.education || [], languages: rp.languages || [],
        certifications: rp.certifications || []
      });
      if (rp.cvPhoto) setCvPhoto(rp.cvPhoto);
    } catch (err) { setError('Failed to generate CV. Check server logs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (jobId) handleGenerate(jobId); }, [jobId]);

  // Template change → update colors to defaults for that template
  const handleTemplateChange = (tid) => {
    setTemplate(tid);
    setColors(DEFAULT_COLORS[tid] || DEFAULT_COLORS.modern);
  };

  // Photo upload (base64)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Photo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => setCvPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // Improve ATS
  const handleImproveATS = async () => {
    if (!cvData) return;
    setImproving(true);
    try {
      const currentCV = {
        professionalSummary: editSummary, highlightedSkills: editSkills,
        experienceBullets: editExperience, relevantProjects: editProjects,
        atsKeywords: cvData.atsKeywords, atsScore: cvData.atsScore,
        rawProfile: cvData.rawProfile, targetJob: cvData.targetJob
      };
      const res = await jobApi.improveATS(selectedJobId || jobId, currentCV);
      const improved = res.data.cvData;
      setCvData(prev => ({ ...prev, ...improved }));
      setEditSummary(improved.professionalSummary || editSummary);
      setEditSkills(improved.highlightedSkills || editSkills);
      setEditExperience(improved.experienceBullets || editExperience);
      setEditProjects(improved.relevantProjects || editProjects);
    } catch (err) { alert('Failed to improve ATS.'); }
    finally { setImproving(false); }
  };

  // Skill management
  const addSkill = () => { const s = prompt('Enter skill:'); if (s?.trim()) setEditSkills([...editSkills, s.trim()]); };
  const removeSkill = (idx) => setEditSkills(editSkills.filter((_, i) => i !== idx));

  // Experience bullet management
  const updateBullet = (ei, bi, val) => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, bullets: e.bullets.map((b, j) => j === bi ? val : b) } : e));
  const addBullet = (ei) => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, bullets: [...(e.bullets || []), ''] } : e));
  const removeBullet = (ei, bi) => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, bullets: e.bullets.filter((_, j) => j !== bi) } : e));

  // Project toggle
  const toggleProject = (idx) => {
    setEditProjects(prev => {
      const p = [...prev];
      p[idx] = { ...p[idx], _hidden: !p[idx]._hidden };
      return p;
    });
  };
  const addManualProject = () => {
    const title = prompt('Project title:');
    if (!title) return;
    setEditProjects([...editProjects, { title, description: '', tech: [], _manual: true }]);
  };

  // Build preview data
  const previewData = cvData ? {
    ...cvData, professionalSummary: editSummary, highlightedSkills: editSkills,
    experienceBullets: editExperience,
    relevantProjects: editProjects.filter(p => !p._hidden),
    personalInfo, cvPhoto
  } : null;

  // Print/PDF
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const previewEl = document.getElementById('cv-preview-content');
    if (!previewEl || !printWindow) return;
    printWindow.document.write(`<html><head><title>CV - ${personalInfo.name || 'Resume'}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4;margin:0}body{font-family:'Inter',sans-serif}</style></head><body>${previewEl.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // ═══════ RENDER ═══════
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>AI CV Generator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 4 }}>
            {jobInfo ? `Tailored for: ${jobInfo.title} at ${jobInfo.company}` : 'Generate ATS-optimized CVs tailored to specific jobs'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {cvData && <button className="btn btn-primary" onClick={handlePrint}>📄 Download PDF</button>}
          <button className="btn btn-secondary" onClick={() => navigate('/admin/jobs')}>← Jobs</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', color: '#ef4444', fontSize: '14px' }}>{error}</div>}

      {/* Standalone job picker when no jobId in URL */}
      {!jobId && !cvData && (
        <motion.div className="admin-chart-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>📄 Select a Job to Generate CV</h3>
          {analyzedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              <p>No analyzed jobs yet. Go to <strong>AI Job Matcher</strong>, analyze some jobs, then come back here.</p>
              <button className="btn btn-primary" onClick={() => navigate('/admin/jobs')} style={{ marginTop: 'var(--space-md)' }}>Go to Job Matcher</button>
            </div>
          ) : (
            <div>
              <select className="form-input" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
                style={{ width: '100%', fontSize: '14px', marginBottom: 'var(--space-md)' }}>
                <option value="">— Choose an analyzed job —</option>
                {analyzedJobs.map(j => (
                  <option key={j._id} value={j._id}>{j.title} at {j.company} ({j.matchScore || 0}% match)</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => handleGenerate()} disabled={!selectedJobId || loading}>
                {loading ? '⟳ Generating...' : '✨ Generate Tailored CV'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {loading && <CVSkeleton />}

      {/* Main Editor + Preview */}
      {cvData && !loading && (
        <div className="cv-layout">
          {/* LEFT: Editor Panel */}
          <div className="cv-editor">
            {/* Template & Color */}
            <EditorCard title="Template & Colors" icon="🎨" delay={0}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => handleTemplateChange(t.id)}
                    className={`btn ${template === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    title={t.desc}>{t.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Primary: <input type="color" value={colors.primary} onChange={e => setColors({ ...colors, primary: e.target.value })} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                </label>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Accent: <input type="color" value={colors.accent} onChange={e => setColors({ ...colors, accent: e.target.value })} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                </label>
              </div>
            </EditorCard>

            {/* Photo */}
            <EditorCard title="CV Photo (Optional)" icon="📷" delay={0.03}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                {cvPhoto ? (
                  <img src={cvPhoto} alt="CV" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                )}
                <div style={{ flex: 1, display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>Upload Photo</button>
                  {cvPhoto && <button className="btn btn-danger btn-sm" onClick={() => setCvPhoto('')}>Remove</button>}
                  <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="checkbox" checked={showPhoto} onChange={e => setShowPhoto(e.target.checked)} /> Show in CV
                  </label>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>
            </EditorCard>

            {/* Personal Info */}
            <EditorCard title="Personal Information" icon="👤" delay={0.05}>
              <div className="cv-form-grid">
                <FullInput label="Full Name" value={personalInfo.name} onChange={v => setPersonalInfo({ ...personalInfo, name: v })} />
                <FullInput label="Job Title / Designation" value={personalInfo.title} onChange={v => setPersonalInfo({ ...personalInfo, title: v })} />
              </div>
              <div className="cv-form-grid">
                <FullInput label="Email" value={personalInfo.email} onChange={v => setPersonalInfo({ ...personalInfo, email: v })} type="email" />
                <FullInput label="Phone" value={personalInfo.phone} onChange={v => setPersonalInfo({ ...personalInfo, phone: v })} />
              </div>
              <FullInput label="Location" value={personalInfo.location} onChange={v => setPersonalInfo({ ...personalInfo, location: v })} />
            </EditorCard>

            {/* ATS Score */}
            <EditorCard title="ATS Compatibility" icon="📊" delay={0.07}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated ATS pass rate</span>
                <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: (cvData.atsScore || 0) > 75 ? '#10b981' : (cvData.atsScore || 0) > 50 ? '#f59e0b' : '#ef4444' }}>
                  {cvData.atsScore || 0}%
                </span>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${cvData.atsScore || 0}%`, background: (cvData.atsScore || 0) > 75 ? '#10b981' : (cvData.atsScore || 0) > 50 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              {cvData.atsKeywords?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 3 }}>Keywords matched:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{cvData.atsKeywords.map((kw, i) => <span key={i} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 5px', borderRadius: 3, fontSize: '9px' }}>{kw}</span>)}</div>
                </div>
              )}
              <button className="btn btn-primary btn-sm" onClick={handleImproveATS} disabled={improving} style={{ width: '100%' }}>
                {improving ? <><div className="skeleton" style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', marginRight: 6 }} /> Optimizing...</> : '🚀 AI Improve ATS (presents your content better)'}
              </button>
              {cvData.improvements?.length > 0 && (
                <div style={{ marginTop: 8, padding: 'var(--space-sm)', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, marginBottom: 3 }}>✅ What was improved:</div>
                  <ul style={{ paddingLeft: 14, margin: 0 }}>{cvData.improvements.map((imp, i) => <li key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 1 }}>{imp}</li>)}</ul>
                </div>
              )}
            </EditorCard>

            {/* Professional Summary */}
            <EditorCard title="Professional Summary" icon="📝" delay={0.09}>
              <textarea className="form-textarea" value={editSummary} onChange={e => setEditSummary(e.target.value)}
                style={{ width: '100%', minHeight: 100, fontSize: '13px', lineHeight: 1.6, resize: 'vertical' }} />
            </EditorCard>

            {/* Skills */}
            <EditorCard title="Highlighted Skills" icon="⚡" delay={0.11}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {editSkills.map((s, i) => (
                  <span key={i} style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s}<button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '11px', padding: 0, marginLeft: 2 }}>✕</button>
                  </span>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={addSkill}>+ Add Skill</button>
            </EditorCard>

            {/* Experience */}
            <EditorCard title="Experience" icon="💼" delay={0.13}>
              {editExperience.map((exp, ei) => (
                <div key={ei} style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)' }}>
                  <div className="cv-form-grid">
                    <FullInput label="Role / Title" value={exp.role} onChange={v => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, role: v } : e))} />
                    <FullInput label="Company / Milestone" value={exp.company} onChange={v => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, company: v } : e))} />
                  </div>
                  <FullInput label="Duration" value={exp.duration} onChange={v => setEditExperience(prev => prev.map((e, i) => i === ei ? { ...e, duration: v } : e))} />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, marginTop: 4 }}>ACHIEVEMENTS</div>
                  {(exp.bullets || []).map((bullet, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                      <input className="form-input" value={bullet} onChange={e => updateBullet(ei, bi, e.target.value)}
                        style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }} />
                      <button onClick={() => removeBullet(ei, bi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}>✕</button>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={() => addBullet(ei)} style={{ fontSize: '10px' }}>+ Bullet</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setEditExperience([...editExperience, { company: '', role: '', duration: '', bullets: [] }])} style={{ marginTop: 4 }}>+ Add Experience Manually</button>
            </EditorCard>

            {/* Projects — with toggles */}
            <EditorCard title="Key Projects" icon="🚀" delay={0.15}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 8 }}>AI selected relevant projects. Toggle to include/exclude.</p>
              {editProjects.map((proj, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, padding: 'var(--space-sm)', background: proj._hidden ? 'rgba(239,68,68,0.05)' : 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', opacity: proj._hidden ? 0.5 : 1 }}>
                  <input type="checkbox" checked={!proj._hidden} onChange={() => toggleProject(idx)} style={{ marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input className="form-input" value={proj.title} onChange={e => setEditProjects(prev => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))}
                      style={{ fontSize: '12px', padding: '4px 8px', marginBottom: 6, width: '100%', fontWeight: 600 }} placeholder="Project Title" />
                    <textarea className="form-textarea" value={proj.description} onChange={e => setEditProjects(prev => prev.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))}
                      style={{ fontSize: '11px', padding: '6px 8px', width: '100%', minHeight: '60px', resize: 'vertical', marginBottom: 6 }} placeholder="Project description (supports multiple lines)..." />
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>TECH:</span>
                      {(proj.tech || []).map((t, ti) => (
                        <span key={ti} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: 4, fontSize: '9px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {t}
                          <button onClick={() => setEditProjects(prev => prev.map((p, i) => i === idx ? { ...p, tech: p.tech.filter((_, tj) => tj !== ti) } : p))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, marginTop: -1 }}>✕</button>
                        </span>
                      ))}
                      <button onClick={() => {
                        const newTech = prompt('Enter tech skill (e.g., React, Node.js):');
                        if (newTech?.trim()) {
                          setEditProjects(prev => prev.map((p, i) => i === idx ? { ...p, tech: [...(p.tech || []), newTech.trim()] } : p));
                        }
                      }} style={{ background: 'none', border: '1px dashed var(--border-color)', borderRadius: 4, padding: '2px 8px', fontSize: '9px', cursor: 'pointer', color: 'var(--text-muted)' }}>+ Add Tech</button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addManualProject} style={{ marginTop: 4 }}>+ Add Project Manually</button>
            </EditorCard>

            {/* AI Suggestions */}
            {cvData.suggestions?.length > 0 && (
              <EditorCard title="AI Suggestions (Your Content vs Job)" icon="💡" delay={0.17}>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {cvData.suggestions.map((s, i) => <li key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>{s}</li>)}
                </ul>
              </EditorCard>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              <button className="btn btn-secondary" onClick={() => handleGenerate(selectedJobId || jobId)} disabled={loading}>🔄 Regenerate</button>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <motion.div className="cv-preview-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="cv-preview-wrapper">
              <div id="cv-preview-content">
                <CVPreview data={previewData} template={template} colors={colors} showPhoto={showPhoto} />
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
              Live preview • A4 format • {TEMPLATES.find(t => t.id === template)?.label || template}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
