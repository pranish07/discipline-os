import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useRelapses(start_date, end_date) {
  return useQuery({
    queryKey: ['pmo', 'relapses', { start_date, end_date }],
    queryFn: () => api.get('/pmo', { params: { start_date, end_date } }).then(r => r.data),
  });
}

export function usePMOStats() {
  return useQuery({
    queryKey: ['pmo', 'stats'],
    queryFn: () => api.get('/pmo/stats').then(r => r.data),
  });
}

export function useLogRelapse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes) => api.post('/pmo', { notes }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pmo'] }),
  });
}

export function useDeleteRelapse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/pmo/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pmo'] }),
  });
}
