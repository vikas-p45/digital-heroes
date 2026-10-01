import { http, qs } from './api.js';

export const authApi = {
  signup: (b) => http.post('/auth/signup', b),
  login: (b) => http.post('/auth/login', b),
  me: () => http.get('/auth/me'),
};

export const publicApi = {
  config: () => http.get('/config'),
  charities: (p = {}) => http.get(`/charities${qs(p)}`),
  charity: (slug) => http.get(`/charities/${slug}`),
  donate: (b) => http.post('/donations', b),
  draws: (p = {}) => http.get(`/draws${qs(p)}`),
};

export const meApi = {
  dashboard: () => http.get('/me/dashboard'),
  setCharity: (b) => http.patch('/me/charity', b),
  addScore: (b) => http.post('/me/scores', b),
  editScore: (id, b) => http.put(`/me/scores/${id}`, b),
  deleteScore: (id) => http.del(`/me/scores/${id}`),
  uploadProof: (id, image) => http.post(`/me/winnings/${id}/proof`, { image }),
};

export const subscriptionApi = {
  checkout: (plan) => http.post('/subscription/checkout', { plan }),
  mockActivate: (plan) => http.post('/subscription/mock-activate', { plan }),
  cancel: () => http.post('/subscription/cancel'),
  resume: () => http.post('/subscription/resume'),
};

export const adminApi = {
  reports: () => http.get('/admin/reports'),
  users: (p) => http.get(`/admin/users${qs(p)}`),
  user: (id) => http.get(`/admin/users/${id}`),
  patchUser: (id, b) => http.patch(`/admin/users/${id}`, b),
  userSubscription: (id, b) => http.patch(`/admin/users/${id}/subscription`, b),
  addUserScore: (id, b) => http.post(`/admin/users/${id}/scores`, b),
  editUserScore: (id, sid, b) => http.put(`/admin/users/${id}/scores/${sid}`, b),
  deleteUserScore: (id, sid) => http.del(`/admin/users/${id}/scores/${sid}`),
  settings: () => http.get('/admin/draw-settings'),
  saveSettings: (b) => http.put('/admin/draw-settings', b),
  draws: (p) => http.get(`/admin/draws${qs(p)}`),
  draw: (id) => http.get(`/admin/draws/${id}`),
  createDraw: (b) => http.post('/admin/draws', b),
  patchDraw: (id, b) => http.patch(`/admin/draws/${id}`, b),
  deleteDraw: (id) => http.del(`/admin/draws/${id}`),
  simulate: (id, b) => http.post(`/admin/draws/${id}/simulate`, b),
  publish: (id, b) => http.post(`/admin/draws/${id}/publish`, b),
  charities: (p) => http.get(`/admin/charities${qs(p)}`),
  createCharity: (b) => http.post('/admin/charities', b),
  updateCharity: (id, b) => http.put(`/admin/charities/${id}`, b),
  deleteCharity: (id) => http.del(`/admin/charities/${id}`),
  winners: (p) => http.get(`/admin/winners${qs(p)}`),
  winnerProof: (id) => http.get(`/admin/winners/${id}/proof`),
  reviewWinner: (id, b) => http.post(`/admin/winners/${id}/review`, b),
  payWinner: (id) => http.post(`/admin/winners/${id}/pay`),
};
