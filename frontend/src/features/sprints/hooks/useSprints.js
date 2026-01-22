// src/features/sprints/hooks/useSprints.js
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import sprintService from '../services/sprintService';

export const useSprints = (projectId, filters = {}) => {
  const { user } = useSelector(state => state.auth);
  const activeCompanyId = user?.activeCompanyId || null;

  return useQuery({
    // The query key includes the projectId, activeCompanyId and any other filters
    // to ensure data is refetched when they change.
    queryKey: ['sprints', projectId, activeCompanyId, filters],
    queryFn: () => sprintService.getAllSprints(projectId, filters),
    enabled: !!projectId, // Only run if projectId is provided
    onError: (error) => {
      console.error(`Error fetching sprints for project ${projectId}:`, error);
    },
    // Disable retries for 403/404 errors to allow immediate redirection
    retry: (failureCount, error) => {
      const status = error.response?.status || error.status;
      if (status === 404 || status === 403) return false;
      return failureCount < 3;
    }
  });
};