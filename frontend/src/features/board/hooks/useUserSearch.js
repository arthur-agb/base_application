// src/features/board/hooks/useUserSearch.js
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useUserSearch = (searchQuery) => {
  return useQuery({
    // The query key includes the search term so that results are cached
    queryKey: ['userSearch', searchQuery],
    queryFn: () => boardService.searchUsers(searchQuery),
    // Only run the query if the search term is not empty (e.g., has 2+ characters)
    enabled: !!searchQuery && searchQuery.length > 1,
    staleTime: 1000 * 60 * 5, // Cache search results for 5 minutes
    placeholderData: keepPreviousData,
  });
};

// You can create similar hooks: useEpicSearch(projectId, query) and useSprintSearch(projectKey, query)