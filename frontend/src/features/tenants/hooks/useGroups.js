// src/features/tenants/hooks/useGroups.js
import { useQuery } from '@tanstack/react-query';
import groupService from '../services/groupService';
import { useSelector } from 'react-redux';

export const useGroups = () => {
  const activeCompanyId = useSelector((state) => state.auth.user?.activeCompanyId);

  return useQuery({
    queryKey: ['groups', activeCompanyId], // The query will re-fetch if the active company changes
    queryFn: () => groupService.getGroups(),
    enabled: !!activeCompanyId, // Only run the query if there is an active company
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    onError: (error) => {
        console.error("Error fetching groups:", error);
    }
  });
};