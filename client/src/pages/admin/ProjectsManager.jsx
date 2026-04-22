import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import TechIcon from '../../components/TechIcon';
import { useData } from '../../context/DataContext';
import api from '../../api/axiosConfig';

const emptyProject = {
  title: '', description: '', longDescription: '', thumbnail: '',
  techStack: [], liveUrl: '', githubUrl: '', category: 'web', featured: false
};

export default function ProjectsManager() {
  const { projects, refetch } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [techInput, setTechInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const fileInputRef = useRef(null);

  // For Drag-and-Drop ordering
  const [localProjects, setLocalProjects] = useState([]);
  useEffect(() => { setLocalProjects(projects); }, [projects]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => setDraggedIndex(index);
  
  const handleDragEnter = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...localProjects];
    const item = newItems.splice(draggedIndex, 1)[0];
    newItems.splice(index, 0, item);
    setDraggedIndex(index);
    setLocalProjects(newItems);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      await api.patch('/projects/reorder', { orderedIds: localProjects.map(p => p._id) });
      refetch();
    } catch (err) {
      alert('Failed to sync project order.');
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyProject);
    setTechInput('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ ...project });
    setTechInput('');
    setThumbnailFile(null);
    setThumbnailPreview(project.thumbnail || '');
    setModalOpen(true);
  };

  const addTech = () => {
    if (techInput.trim() && !form.techStack.includes(techInput.trim().toLowerCase())) {
      setForm({ ...form, techStack: [...form.techStack, techInput.trim().toLowerCase()] });
      setTechInput('');
    }
  };

  const removeTech = (tech) => {
    setForm({ ...form, techStack: form.techStack.filter(t => t !== tech) });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.');
      return;
    }

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setForm({ ...form, thumbnail: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let thumbnailData = form.thumbnail;

      // If a new file was selected, convert to base64 for storage
      if (thumbnailFile) {
        thumbnailData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(thumbnailFile);
        });
      }

      const payload = { ...form, thumbnail: thumbnailData };

      if (editing) {
        await api.put(`/projects/${editing._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      setModalOpen(false);
      refetch();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      refetch();
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Project</button>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Project</th>
              <th>Category</th>
              <th>Tech Stack</th>
              <th>Featured</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {localProjects.map((project, index) => (
              <tr 
                key={project._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={{ cursor: draggedIndex !== null ? 'grabbing' : 'grab', opacity: draggedIndex === index ? 0.3 : 1 }}
              >
                <td>
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: 48, height: 36, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>—</div>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{project.title}</td>
                <td><span className="tech-tag">{project.category}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {project.techStack?.slice(0, 3).map(t => (
                      <span key={t} className="tech-tag"><TechIcon name={t} size={12} /> {t}</span>
                    ))}
                    {project.techStack?.length > 3 && <span className="tech-tag">+{project.techStack.length - 3}</span>}
                  </div>
                </td>
                <td>{project.featured ? '⭐' : '-'}</td>
                <td>{project.views}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(project)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {localProjects.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No projects yet. Click "Add Project" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">
              Short Description * 
              <span style={{ float: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {form.description?.length || 0} characters
              </span>
            </label>
            <textarea className="form-textarea" required style={{ minHeight: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">
              Detailed Description
              <span style={{ float: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {form.longDescription?.length || 0} characters
              </span>
            </label>
            <textarea className="form-textarea" value={form.longDescription} onChange={e => setForm({ ...form, longDescription: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="ai">AI</option>
                <option value="backend">Backend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Featured</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                Mark as featured project
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input className="form-input" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())} placeholder="e.g. react, nodejs" style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTech}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }}>
              {form.techStack.map(t => (
                <span key={t} className="tech-tag" style={{ cursor: 'pointer' }} onClick={() => removeTech(t)}>
                  <TechIcon name={t} size={14} /> {t} ✕
                </span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Live URL</label>
              <input className="form-input" value={form.liveUrl} onChange={e => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">GitHub URL</label>
              <input className="form-input" value={form.githubUrl} onChange={e => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="form-group">
            <label className="form-label">Project Thumbnail</label>
            <div className="thumbnail-upload-area">
              {thumbnailPreview ? (
                <div className="thumbnail-preview-wrapper">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="thumbnail-preview-img" />
                  <button type="button" className="thumbnail-remove-btn" onClick={removeThumbnail}>✕ Remove</button>
                </div>
              ) : (
                <div className="thumbnail-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <div className="thumbnail-dropzone-icon">🖼️</div>
                  <p>Click to upload thumbnail</p>
                  <span>Recommended: 1280x720 • AVIF, PNG, JPG, WebP • Max 5MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, image/avif, image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
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
