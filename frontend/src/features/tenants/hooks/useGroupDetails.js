// src/features/tenants/hooks/useGroupDetails.js
import { useQuery } from '@tanstack/react-query';
import groupService from '../services/groupService';

export const useGroupDetails = (groupId) => {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupService.getGroupById(groupId),
    enabled: !!groupId, // The query will not run until a groupId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
     onError: (error) => {
        console.error(`Error fetching group details for ID ${groupId}:`, error);
    }
  });
};