
// frontend/src/features/epics/hooks/useEpics.js
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import epicService from '../services/epicService';

/**
 * React Query hook to fetch all epics for a specific project.
 * @param {string} projectId - The ID of the project whose epics are to be fetched.
 * @returns The result of the useQuery hook.
 */
export const useEpics = (projectId) => {
    const { user } = useSelector(state => state.auth);
    const activeCompanyId = user?.activeCompanyId || null;

    return useQuery({
        // The query key is an array that uniquely identifies this query.
        // It includes the entity name ('epics'), projectId, and activeCompanyId to ensure
        // data is fetched and cached on a per-project and per-context basis.
        queryKey: ['epics', projectId, activeCompanyId],

        // The query function is the async function that fetches the data.
        queryFn: () => epicService.getEpicsByProject(projectId),

        // This option ensures the query will not run if projectId is falsy (e.g., null, undefined).
        // This prevents unnecessary API calls when the component is mounting and the ID isn't available yet.
        enabled: !!projectId,

        // Disable retries for 403/404 errors to allow immediate redirection
        retry: (failureCount, error) => {
            const status = error.response?.status || error.status;
            if (status === 404 || status === 403) return false;
            return failureCount < 3;
        }
    });
};