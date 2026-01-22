// src/features/board/hooks/useEpicSearch.js
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useEpicSearch = (projectKey, searchQuery) => {
  return useQuery({
    queryKey: ['epicSearch', projectKey, searchQuery],
    queryFn: () => boardService.searchEpics(projectKey, searchQuery),
    enabled: !!projectKey && !!searchQuery && searchQuery.length > 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
};