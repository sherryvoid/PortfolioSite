import api from './axiosConfig';

export const jobApi = {
  getJobs: (params) => api.get('/jobs', { params }),
  getStats: () => api.get('/jobs/stats'),
  getApplied: () => api.get('/jobs/applied'),
  syncJobs: (platforms) => api.post('/jobs/sync', { platforms }),
  analyzeJob: (id) => api.post(`/jobs/${id}/analyze`),
  markApplied: (id) => api.patch(`/jobs/${id}/applied`),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  resetAll: () => api.delete('/jobs/reset')
};
