// src/features/board/hooks/useSprintSearch.js
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useSprintSearch = (projectKey, searchQuery) => {
  return useQuery({
    queryKey: ['sprintSearch', projectKey, searchQuery],
    queryFn: () => boardService.searchSprints(projectKey, searchQuery),
    enabled: !!projectKey && !!searchQuery && searchQuery.length > 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
};