import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import api from '../../api/axiosConfig';

const emptyCert = { title: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '', badgeImage: '' };

export default function CertsManager() {
  const { certifications, refetch } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCert);
  const [loading, setLoading] = useState(false);

  const openNew = () => { setEditing(null); setForm(emptyCert); setModalOpen(true); };
  const openEdit = (cert) => {
    setEditing(cert);
    setForm({
      ...cert,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/certifications/${editing._id}`, form);
      } else {
        await api.post('/certifications', form);
      }
      setModalOpen(false);
      refetch();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    try { await api.delete(`/certifications/${id}`); refetch(); } catch { alert('Failed to delete'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      <div className="admin-header">
        <h1>Certifications</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Certification</button>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Issuer</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certifications.map(cert => (
              <tr key={cert._id}>
                <td style={{ fontWeight: 600 }}>{cert.title}</td>
                <td style={{ color: 'var(--accent-blue)' }}>{cert.issuer}</td>
                <td>{formatDate(cert.issueDate)}</td>
                <td>{formatDate(cert.expiryDate)}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cert)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cert._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {certifications.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>No certifications yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Certification' : 'New Certification'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. AWS Solutions Architect" />
          </div>
          <div className="form-group">
            <label className="form-label">Issuer *</label>
            <input className="form-input" required value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} placeholder="e.g. Amazon Web Services" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input className="form-input" type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Credential URL</label>
            <input className="form-input" value={form.credentialUrl} onChange={e => setForm({ ...form, credentialUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Badge Image URL</label>
            <input className="form-input" value={form.badgeImage} onChange={e => setForm({ ...form, badgeImage: e.target.value })} placeholder="https://..." />
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
