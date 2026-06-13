import api from '../api/axios.js';

export const SleepAPI = {
  get: (date) => api.get(`/sleep/${date}`).then(r => r.data),
  list: (start, end) => api.get('/sleep', { params: { start_date: start, end_date: end } }).then(r => r.data),
  upsert: (data) => api.post('/sleep', data).then(r => r.data),
  stats: (period) => api.get('/sleep/stats', { params: { period } }).then(r => r.data),
};

export const TaskAPI = {
  byDate: (date) => api.get('/tasks', { params: { date } }).then(r => r.data),
  range: (start, end) => api.get('/tasks/range', { params: { start_date: start, end_date: end } }).then(r => r.data),
  upsert: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  stats: (period) => api.get('/tasks/stats', { params: { period } }).then(r => r.data),
};

export const PMOAPI = {
  list: (start, end) => api.get('/pmo', { params: { start_date: start, end_date: end } }).then(r => r.data),
  stats: () => api.get('/pmo/stats').then(r => r.data),
  add: (data) => api.post('/pmo', data).then(r => r.data),
};

export const ExerciseAPI = {
  schedule: () => api.get('/exercise/schedule').then(r => r.data),
  saveSchedule: (schedule) => api.post('/exercise/schedule', { schedule }).then(r => r.data),
  logs: (start, end) => api.get('/exercise/logs', { params: { start_date: start, end_date: end } }).then(r => r.data),
  log: (data) => api.post('/exercise/logs', data).then(r => r.data),
  stats: (period) => api.get('/exercise/stats', { params: { period } }).then(r => r.data),
};

export const ScreenAPI = {
  get: (date) => api.get('/screen-time', { params: { date } }).then(r => r.data),
  list: () => api.get('/screen-time').then(r => r.data),
  upsert: (data) => api.post('/screen-time', data).then(r => r.data),
  yearData: (year) => api.get('/screen-time/stats', { params: { year } }).then(r => r.data),
};

export const GoalAPI = {
  list: () => api.get('/goals').then(r => r.data),
  add: (data) => api.post('/goals', data).then(r => r.data),
  update: (id, data) => api.put(`/goals/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/goals/${id}`).then(r => r.data),
};

export const StatsAPI = {
  get: (period) => api.get('/stats', { params: { period } }).then(r => r.data),
};