import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useTasks(date) {
  return useQuery({
    queryKey: ['tasks', date],
    queryFn: () => api.get('/tasks', { params: { date } }).then(r => r.data),
    enabled: !!date,
  });
}

export function useTasksRange(start_date, end_date) {
  return useQuery({
    queryKey: ['tasks', 'range', { start_date, end_date }],
    queryFn: () => api.get('/tasks/range', { params: { start_date, end_date } }).then(r => r.data),
    enabled: !!start_date && !!end_date,
  });
}

export function useUpsertTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/tasks', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/tasks/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useTaskStats(period = 'month') {
  return useQuery({
    queryKey: ['tasks', 'stats', period],
    queryFn: () => api.get('/tasks/stats', { params: { period } }).then(r => r.data),
  });
}
