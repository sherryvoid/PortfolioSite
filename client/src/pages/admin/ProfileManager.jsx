import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import api from '../../api/axiosConfig';

const Field = ({ label, value, onChange, type = 'text', ...props }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {type === 'textarea' ? (
      <textarea className="form-textarea" value={value} onChange={onChange} {...props} />
    ) : (
      <input className="form-input" type={type} value={value} onChange={onChange} {...props} />
    )}
  </div>
);

export default function ProfileManager() {
  const { profile, refetch } = useData();
  const [form, setForm] = useState({
    name: '', siteName: '', title: '', bio: '', email: '', phone: '', location: '',
    heroSubtitle: '', heroGreeting: '', heroRoles: [], status: '',
    availability: '', heroDesignation: '', heroAbout: '',
    social: { github: '', linkedin: '', twitter: '', website: '' },
    stats: { yearsExperience: 0, projectsCompleted: 0, happyClients: 0 },
    aboutTimeline: [],
    experience: [],
    education: [],
    languages: [],
    preferredJobTypes: [],
    preferredLocations: [],
    preferredWorkModes: []
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const logoRef = useRef(null);
  const faviconRef = useRef(null);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        siteName: profile.siteName || '',
        title: profile.title || '',
        bio: profile.bio || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        heroSubtitle: profile.heroSubtitle || '',
        heroGreeting: profile.heroGreeting || '',
        heroRoles: profile.heroRoles || [],
        status: profile.status || '',
        availability: profile.availability || profile.status || 'Available for Work',
        heroDesignation: profile.heroDesignation || profile.title || '',
        heroAbout: profile.heroAbout || '',
        social: {
          github: profile.social?.github || '',
          linkedin: profile.social?.linkedin || '',
          twitter: profile.social?.twitter || '',
          website: profile.social?.website || '',
        },
        stats: {
          yearsExperience: profile.stats?.yearsExperience || 0,
          projectsCompleted: profile.stats?.projectsCompleted || 0,
          happyClients: profile.stats?.happyClients || 0,
        },
        aboutTimeline: profile.aboutTimeline || [],
        experience: profile.experience || [],
        education: profile.education || [],
        languages: profile.languages || [],
        preferredJobTypes: profile.preferredJobTypes || [],
        preferredLocations: profile.preferredLocations || [],
        preferredWorkModes: profile.preferredWorkModes || []
      });
      setPhotoPreview(profile.photo || '');
      setLogoPreview(profile.logo || '');
      setFaviconPreview(profile.favicon || '');
    }
  }, [profile]);

  const handleImageChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image.');
    if (file.size > 5 * 1024 * 1024) return alert('Max 5MB.');
    setFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e) => handleImageChange(e, setPhotoFile, setPhotoPreview);
  const handleLogoChange = (e) => handleImageChange(e, setLogoFile, setLogoPreview);
  const handleFaviconChange = (e) => handleImageChange(e, setFaviconFile, setFaviconPreview);

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Timeline ──
  const addTimelineItem = () => {
    setForm(prev => ({
      ...prev,
      aboutTimeline: [...prev.aboutTimeline, { year: '', title: '', description: '' }]
    }));
  };

  const updateTimeline = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.aboutTimeline];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, aboutTimeline: updated };
    });
  };

  const removeTimeline = (idx) => {
    setForm(prev => ({
      ...prev,
      aboutTimeline: prev.aboutTimeline.filter((_, i) => i !== idx)
    }));
  };

  // ── Experience ──
  const addExperience = () => {
    setForm(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }]
    }));
  };

  const updateExperience = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const removeExperience = (idx) => {
    setForm(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));
  };

  // ── Education ──
  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', field: '', year: '' }]
    }));
  };

  const updateEducation = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (idx) => {
    setForm(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));
  };

  // ── Languages ──
  const addLanguage = () => {
    setForm(prev => ({
      ...prev,
      languages: [...prev.languages, { name: '', level: '' }]
    }));
  };

  const updateLanguage = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.languages];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, languages: updated };
    });
  };

  const removeLanguage = (idx) => {
    setForm(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== idx) }));
  };

  const toBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.readAsDataURL(file);
  });

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      let photoData = photoPreview;
      if (photoFile) photoData = await toBase64(photoFile);
      let logoData = logoPreview;
      if (logoFile) logoData = await toBase64(logoFile);
      let faviconData = faviconPreview;
      if (faviconFile) faviconData = await toBase64(faviconFile);

      await api.put('/profile', { ...form, photo: photoData, logo: logoData, favicon: faviconData });
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const [generatingSnapshot, setGeneratingSnapshot] = useState(false);
  const handleSnapshot = async () => {
    setGeneratingSnapshot(true);
    try {
      const res = await api.post('/profile/snapshot');
      alert(res.data.message);
    } catch (err) {
      alert('Failed to generate snapshot: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingSnapshot(false);
    }
  };

  const sectionCard = (title, children, delay = 0, action = null) => (
    <motion.div
      className="admin-chart-card"
      style={{ marginTop: 'var(--space-xl)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontWeight: 700 }}>{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );

  return (
    <div>
      <div className="admin-header">
        <h1>Profile & About</h1>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleSnapshot} disabled={generatingSnapshot}>
            {generatingSnapshot ? 'Generating...' : '🛠️ Generate AI Snapshot'}
          </button>
          {saved && <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>✓ Saved!</span>}
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Left Column */}
        <motion.div className="admin-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Basic Info</h3>

          {/* Photo Upload */}
          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <div className="thumbnail-upload-area">
              {photoPreview ? (
                <div className="thumbnail-preview-wrapper">
                  <img src={photoPreview} alt="Profile" className="thumbnail-preview-img" style={{ maxHeight: 160 }} />
                  <button type="button" className="thumbnail-remove-btn" onClick={removePhoto}>✕ Remove</button>
                </div>
              ) : (
                <div className="thumbnail-dropzone" onClick={() => fileRef.current?.click()} style={{ padding: 'var(--space-xl)' }}>
                  <div className="thumbnail-dropzone-icon">📷</div>
                  <p>Upload profile photo</p>
                  <span>PNG, JPG, WebP • Max 5MB</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
          </div>

          <Field label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Field label="Title / Role" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Full Stack Developer" />
          <Field label="Bio / About Description" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} type="textarea" style={{ minHeight: 120 }} />

          <div style={{ borderTop: '1px solid var(--border-color)', margin: 'var(--space-lg) 0', paddingTop: 'var(--space-lg)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>🌐 Site Identity / Branding</h4>
            <Field label="Site Name (Navbar & Header)" value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} placeholder="My Awesome Portfolio" />
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Logo Upload */}
              <div className="form-group">
                <label className="form-label">Site Logo (Navbar)</label>
                <div className="thumbnail-upload-area" style={{ minHeight: '120px' }}>
                  {logoPreview ? (
                    <div className="thumbnail-preview-wrapper" style={{ minHeight: '120px' }}>
                      <img src={logoPreview} alt="Logo" className="thumbnail-preview-img" style={{ maxHeight: 40, width: 'auto', objectFit: 'contain' }} />
                      <button type="button" className="thumbnail-remove-btn" onClick={() => { setLogoFile(null); setLogoPreview(''); if(logoRef.current) logoRef.current.value=''}}>✕</button>
                    </div>
                  ) : (
                    <div className="thumbnail-dropzone" onClick={() => logoRef.current?.click()} style={{ padding: 'var(--space-md)', minHeight: '120px' }}>
                      <div className="thumbnail-dropzone-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✨</div>
                      <p style={{ fontSize: '0.8rem' }}>Upload Logo</p>
                    </div>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="form-group">
                <label className="form-label">Favicon (Browser Tab)</label>
                <div className="thumbnail-upload-area" style={{ minHeight: '120px' }}>
                  {faviconPreview ? (
                    <div className="thumbnail-preview-wrapper" style={{ minHeight: '120px' }}>
                      <img src={faviconPreview} alt="Favicon" className="thumbnail-preview-img" style={{ height: 32, width: 32, borderRadius: 4, objectFit: 'cover' }} />
                      <button type="button" className="thumbnail-remove-btn" onClick={() => { setFaviconFile(null); setFaviconPreview(''); if(faviconRef.current) faviconRef.current.value=''}}>✕</button>
                    </div>
                  ) : (
                    <div className="thumbnail-dropzone" onClick={() => faviconRef.current?.click()} style={{ padding: 'var(--space-md)', minHeight: '120px' }}>
                      <div className="thumbnail-dropzone-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📑</div>
                      <p style={{ fontSize: '0.8rem' }}>Upload Favicon</p>
                    </div>
                  )}
                  <input ref={faviconRef} type="file" accept="image/x-icon,image/png,image/svg+xml,image/*" onChange={handleFaviconChange} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: 'var(--space-lg) 0', paddingTop: 'var(--space-lg)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>🏠 Hero Section Settings</h4>
            <Field label="My Name (Hero)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your Name" />
            <Field label="Availability (Status)" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} placeholder="Available for Work" />
            <Field label="Hero Greeting" value={form.heroGreeting} onChange={e => setForm({ ...form, heroGreeting: e.target.value })} placeholder="Welcome to my portfolio" />
            <Field label="Designation / Title / Role" value={form.heroDesignation} onChange={e => setForm({ ...form, heroDesignation: e.target.value })} placeholder="Full Stack Software Developer" />
            <Field label="Hero About Description (Separate from main Bio)" value={form.heroAbout} onChange={e => setForm({ ...form, heroAbout: e.target.value })} type="textarea" placeholder="Building the future with modern web technologies..." style={{ minHeight: 80 }} />
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div className="admin-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Contact & Social</h3>
          <Field label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" />
          <Field label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Field label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />

          <div style={{ borderTop: '1px solid var(--border-color)', margin: 'var(--space-lg) 0', paddingTop: 'var(--space-lg)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>Social Links</h4>
            <Field label="GitHub" value={form.social.github} onChange={e => setForm({ ...form, social: { ...form.social, github: e.target.value } })} placeholder="https://github.com/..." />
            <Field label="LinkedIn" value={form.social.linkedin} onChange={e => setForm({ ...form, social: { ...form.social, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/..." />
            <Field label="Twitter / X" value={form.social.twitter} onChange={e => setForm({ ...form, social: { ...form.social, twitter: e.target.value } })} placeholder="https://x.com/..." />
            <Field label="Website" value={form.social.website} onChange={e => setForm({ ...form, social: { ...form.social, website: e.target.value } })} placeholder="https://..." />
          </div>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div className="admin-chart-card" style={{ marginTop: 'var(--space-xl)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Experience Stats</h3>
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <Field label="Years Experience" value={form.stats.yearsExperience} type="number" onChange={e => setForm({ ...form, stats: { ...form.stats, yearsExperience: Number(e.target.value) } })} />
          <Field label="Projects Completed" value={form.stats.projectsCompleted} type="number" onChange={e => setForm({ ...form, stats: { ...form.stats, projectsCompleted: Number(e.target.value) } })} />
          <Field label="Happy Clients" value={form.stats.happyClients} type="number" onChange={e => setForm({ ...form, stats: { ...form.stats, happyClients: Number(e.target.value) } })} />
        </div>
      </motion.div>

      {/* Experience */}
      {sectionCard('💼 Work Experience', (
        <>
          {form.experience.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>No experience entries. Click "+ Add" to create one.</p>
          )}
          {form.experience.map((item, idx) => (
            <div key={idx} style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-color)' }}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                <Field label="Company" value={item.company} onChange={e => updateExperience(idx, 'company', e.target.value)} placeholder="Acme Corp" />
                <Field label="Role" value={item.role} onChange={e => updateExperience(idx, 'role', e.target.value)} placeholder="Senior Developer" />
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 'var(--space-md)' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => removeExperience(idx)}>✕</button>
                </div>
              </div>
              <Field label="Duration" value={item.duration} onChange={e => updateExperience(idx, 'duration', e.target.value)} placeholder="Jan 2020 - Present" />
              <Field label="Description" value={item.description} onChange={e => updateExperience(idx, 'description', e.target.value)} type="textarea" placeholder="Spearheaded development..." style={{ minHeight: 80 }} />
            </div>
          ))}
        </>
      ), 0.3, <button className="btn btn-secondary btn-sm" onClick={addExperience}>+ Add</button>)}
      {/* Education */}
      {sectionCard('🎓 Education', (
        <>
          {form.education.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>No education entries. Click "+ Add" to create one.</p>
          )}
          {form.education.map((item, idx) => (
            <div key={idx} style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-color)' }}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                <Field label="Institution" value={item.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} placeholder="MIT" />
                <Field label="Degree" value={item.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="B.Sc." />
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 'var(--space-md)' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => removeEducation(idx)}>✕</button>
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 100px' }}>
                <Field label="Field of Study" value={item.field} onChange={e => updateEducation(idx, 'field', e.target.value)} placeholder="Computer Science" />
                <Field label="Year" value={item.year} onChange={e => updateEducation(idx, 'year', e.target.value)} placeholder="2024" />
              </div>
            </div>
          ))}
        </>
      ), 0.35, <button className="btn btn-secondary btn-sm" onClick={addEducation}>+ Add</button>)}

      {/* Languages */}
      {sectionCard('🌐 Languages', (
        <>
          {form.languages.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>No languages. Click "+ Add" to create one.</p>
          )}
          {form.languages.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end', marginBottom: 'var(--space-sm)' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                {idx === 0 && <label className="form-label">Language</label>}
                <input className="form-input" value={item.name} onChange={e => updateLanguage(idx, 'name', e.target.value)} placeholder="English" />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                {idx === 0 && <label className="form-label">Level</label>}
                <select className="form-input" value={item.level} onChange={e => updateLanguage(idx, 'level', e.target.value)}>
                  <option value="">Select level</option>
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent (C2)</option>
                  <option value="C1">Advanced (C1)</option>
                  <option value="B2">Upper Intermediate (B2)</option>
                  <option value="B1">Intermediate (B1)</option>
                  <option value="A2">Elementary (A2)</option>
                  <option value="A1">Beginner (A1)</option>
                </select>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeLanguage(idx)} style={{ marginBottom: idx === 0 ? 0 : 'var(--space-md)' }}>✕</button>
            </div>
          ))}
        </>
      ), 0.4, <button className="btn btn-secondary btn-sm" onClick={addLanguage}>+ Add</button>)}

      {/* Timeline */}
      <motion.div className="admin-chart-card" style={{ marginTop: 'var(--space-xl)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontWeight: 700 }}>⏳ Timeline & Work Experience</h3>
          <button className="btn btn-secondary btn-sm" onClick={addTimelineItem}>+ Add Entry</button>
        </div>

        {form.aboutTimeline.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-xl)' }}>No timeline entries. Click "Add Entry" to create one.</p>
        )}

        {form.aboutTimeline.map((item, idx) => (
          <div key={idx} style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-color)' }}>
            <div className="form-row" style={{ gridTemplateColumns: '100px 1fr auto' }}>
              <Field label="Year" value={item.year} onChange={e => updateTimeline(idx, 'year', e.target.value)} placeholder="2024" />
              <Field label="Title" value={item.title} onChange={e => updateTimeline(idx, 'title', e.target.value)} placeholder="Milestone title" />
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 'var(--space-md)' }}>
                <button className="btn btn-danger btn-sm" onClick={() => removeTimeline(idx)}>✕</button>
              </div>
            </div>
            <Field label="Description / Details (supports bullets)" value={item.description} onChange={e => updateTimeline(idx, 'description', e.target.value)} type="textarea" placeholder={"- Led the migration...\n- Increased performance by 40%..."} style={{ minHeight: 100 }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
