import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useSchedule() {
  return useQuery({
    queryKey: ['exercise', 'schedule'],
    queryFn: () => api.get('/exercise/schedule').then(r => r.data),
  });
}

export function useSaveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schedule) => api.post('/exercise/schedule', { schedule }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise', 'schedule'] }),
  });
}

export function useExerciseLogs(start_date, end_date) {
  return useQuery({
    queryKey: ['exercise', 'logs', { start_date, end_date }],
    queryFn: () => api.get('/exercise/logs', { params: { start_date, end_date } }).then(r => r.data),
  });
}

export function useUpsertExerciseLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/exercise/logs', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise'] }),
  });
}

export function useExerciseStats(period = 'month') {
  return useQuery({
    queryKey: ['exercise', 'stats', period],
    queryFn: () => api.get('/exercise/stats', { params: { period } }).then(r => r.data),
  });
}
