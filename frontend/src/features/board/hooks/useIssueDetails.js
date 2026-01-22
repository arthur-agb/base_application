// src/features/board/hooks/useIssueDetails.js
import { useQuery } from '@tanstack/react-query';
import boardService from '../services/boardService'; // Adjust path as needed

export const useIssueDetails = (issueId) => {
  return useQuery({ // <-- Changed to object syntax
    queryKey: ['issue', issueId], // Query key: uniquely identifies this query. Includes issueId.
    queryFn: () => boardService.getIssueDetails(issueId), // Query function: fetches the data.
    // Options are now properties of the single argument object
    enabled: !!issueId, // Only run the query if issueId is truthy (i.e., an issue is selected).
    // You can add other options like staleTime, cacheTime, onSuccess, onError here if needed.
    // For example:
    // staleTime: 1000 * 60 * 5, // 5 minutes
    // refetchOnWindowFocus: true,
  });
};