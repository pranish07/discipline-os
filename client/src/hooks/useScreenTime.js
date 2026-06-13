import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useScreenTimeLog(date) {
  return useQuery({
    queryKey: ['screenTime', date],
    queryFn: () => api.get('/screen-time', { params: { date } }).then(r => r.data),
  });
}

export function useScreenTimeStats(period, year) {
  return useQuery({
    queryKey: ['screenTimeStats', period, year],
    queryFn: () => api.get('/screen-time/stats', { params: { period, year } }).then(r => r.data),
  });
}

export function useUpsertScreenTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/screen-time', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screenTime'] }),
  });
}

export function useDeleteScreenTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/screen-time/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screenTime'] }),
  });
}
