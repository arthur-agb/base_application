import { useQuery, keepPreviousData } from '@tanstack/react-query';
import boardService from '../services/boardService';

export const useIssueSearch = (query, boardId) => {
    return useQuery({
        queryKey: ['issueSearch', query, boardId],
        queryFn: () => boardService.searchIssues(query, boardId),
        enabled: !!query && query.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: keepPreviousData,
    });
};
