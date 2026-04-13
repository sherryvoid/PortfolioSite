import api from './axiosConfig';

export const jobApi = {
  getJobs: (params) => api.get('/jobs', { params }),
  getStats: () => api.get('/jobs/stats'),
  getApplied: (params) => api.get('/jobs/applied', { params }),
  syncJobs: (platforms, searchQuery) => api.post('/jobs/sync', { platforms, searchQuery }),
  analyzeJob: (id) => api.post(`/jobs/${id}/analyze`),
  markApplied: (id) => api.patch(`/jobs/${id}/applied`),
  updateStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
  updateNotes: (id, notes) => api.patch(`/jobs/${id}/notes`, { notes }),
  updateContactEmail: (id, email) => api.patch(`/jobs/${id}/contact-email`, { email }),
  sendFollowUp: (id) => api.post(`/jobs/${id}/followup-email`),
  generateCV: (id) => api.post(`/jobs/${id}/generate-cv`),
  improveATS: (id, currentCV) => api.post(`/jobs/${id}/improve-ats`, { currentCV }),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  resetAll: () => api.delete('/jobs/reset')
};
