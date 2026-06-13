import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useSleepLogs(start_date, end_date) {
  return useQuery({
    queryKey: ['sleep', { start_date, end_date }],
    queryFn: () => api.get('/sleep', { params: { start_date, end_date } }).then(r => r.data),
    enabled: !!start_date,
  });
}

export function useSleepLog(date) {
  return useQuery({
    queryKey: ['sleep', date],
    queryFn: () => api.get(`/sleep/${date}`).then(r => r.data),
    enabled: !!date,
  });
}

export function useUpsertSleepLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/sleep', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sleep'] }),
  });
}

export function useSleepStats(period = 'week') {
  return useQuery({
    queryKey: ['sleep', 'stats', period],
    queryFn: () => api.get('/sleep/stats', { params: { period } }).then(r => r.data),
  });
}
