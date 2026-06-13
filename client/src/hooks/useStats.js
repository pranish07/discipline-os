import { useQuery } from '@tanstack/react-query';
import api from '../api/axios.js';

export function useOverallStats(period = 'day') {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: () => api.get('/stats', { params: { period } }).then(r => r.data),
  });
}
