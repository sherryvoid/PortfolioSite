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
    name: '', title: '', bio: '', email: '', phone: '', location: '',
    heroSubtitle: '',
    social: { github: '', linkedin: '', twitter: '', website: '' },
    stats: { yearsExperience: 0, projectsCompleted: 0, happyClients: 0 },
    aboutTimeline: []
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        title: profile.title || '',
        bio: profile.bio || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        heroSubtitle: profile.heroSubtitle || '',
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
      });
      setPhotoPreview(profile.photo || '');
    }
  }, [profile]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image.');
    if (file.size > 5 * 1024 * 1024) return alert('Max 5MB.');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      let photoData = photoPreview;
      if (photoFile) {
        photoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(photoFile);
        });
      }
      await api.put('/profile', { ...form, photo: photoData });
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div>
      <div className="admin-header">
        <h1>Profile & About</h1>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
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
          <Field label="Hero Subtitle (typewriter)" value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} placeholder="Software Developer · Problem Solver · Creator" />
          <Field label="Bio / About Description" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} type="textarea" style={{ minHeight: 120 }} />
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

      {/* Timeline */}
      <motion.div className="admin-chart-card" style={{ marginTop: 'var(--space-xl)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontWeight: 700 }}>About Timeline</h3>
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
            <Field label="Description" value={item.description} onChange={e => updateTimeline(idx, 'description', e.target.value)} placeholder="Brief description" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
