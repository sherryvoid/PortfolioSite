import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import TechIcon from '../../components/TechIcon';
import { useData } from '../../context/DataContext';
import api from '../../api/axiosConfig';

const categories = ['frontend', 'backend', 'database', 'devops', 'tools', 'language'];
const emptySkill = { name: '', icon: '', category: 'frontend', proficiency: 50 };

export default function SkillsManager() {
  const { skills, refetch } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySkill);
  const [loading, setLoading] = useState(false);

  const openNew = () => { setEditing(null); setForm(emptySkill); setModalOpen(true); };
  const openEdit = (skill) => { setEditing(skill); setForm({ ...skill }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/skills/${editing._id}`, form);
      } else {
        await api.post('/skills', form);
      }
      setModalOpen(false);
      refetch();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save skill');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    try { await api.delete(`/skills/${id}`); refetch(); } catch { alert('Failed to delete'); }
  };

  // Group skills by category
  const grouped = skills.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="admin-header">
        <h1>Skills</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Skill</button>
      </div>

      {Object.entries(grouped).map(([category, categorySkills]) => (
        <div key={category} style={{ marginBottom: 'var(--space-2xl)' }}>
          <h3 style={{ textTransform: 'capitalize', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
            {category}
          </h3>
          <div className="skills-grid">
            {categorySkills.map((skill, i) => (
              <motion.div
                key={skill._id}
                className="skill-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => openEdit(skill)}
              >
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleDelete(skill._id); }}
                  style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', fontSize: '10px' }}
                >✕</button>
                <div className="skill-icon">
                  <TechIcon name={skill.icon || skill.name.toLowerCase()} size={40} />
                </div>
                <span className="skill-name">{skill.name}</span>
                <div className="skill-bar-container">
                  <div className="skill-bar" style={{ width: `${skill.proficiency}%` }} />
                </div>
                <span className="skill-proficiency">{skill.proficiency}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {skills.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--text-muted)' }}>
          No skills yet. Click "Add Skill" to add your first one.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Skill' : 'New Skill'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. React" />
            </div>
            <div className="form-group">
              <label className="form-label">Icon Slug</label>
              <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. react, nodejs" />
              {form.icon && <div style={{ marginTop: 8 }}><TechIcon name={form.icon} size={32} /></div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Proficiency: {form.proficiency}%</label>
              <input type="range" min="0" max="100" value={form.proficiency} onChange={e => setForm({ ...form, proficiency: Number(e.target.value) })} style={{ width: '100%', marginTop: 'var(--space-sm)' }} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
