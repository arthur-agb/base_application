import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import boardService from '../services/boardService';
import { useSelector } from 'react-redux';

export const useBoardData = (boardId) => {
  const user = useSelector(state => state.auth.user);
  const activeCompanyId = user?.activeCompanyId || null;

  const query = useQuery({
    // Include activeCompanyId in the key to force refetch/cache separation when context changes
    queryKey: ['board', boardId, { activeCompanyId }],
    queryFn: () => boardService.getBoard(boardId), // Service function to fetch data
    enabled: !!boardId, // Query will only run if boardId is truthy
    // staleTime prevents React Query from refetching "fresh" data, avoiding race conditions
    // with optimistic updates during drag operations
    staleTime: 1000 * 30, // 30 seconds - data is considered "fresh"
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in garbage collection cache
    retry: (failureCount, error) => {
      // Don't retry on 403 (Forbidden) or 404 (Not Found)
      if (error?.response?.status === 403 || error?.response?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  useEffect(() => {
    // Only fetch tracking if needed
  }, [query.data]);

  return query;
};