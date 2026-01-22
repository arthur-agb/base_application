// frontend/src/features/epics/hooks/useCreateEpic.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import epicService from '../services/epicService';

/**
 * React Query hook for creating a new epic.
 * @param {string} projectId - The ID of the project for cache invalidation.
 * @returns The result of the useMutation hook.
 */
export const useCreateEpic = (projectId) => {
    const queryClient = useQueryClient();

    return useMutation({
        // UPDATED: The mutation function now adapts the variables from the
        // component's `mutate` call to match the service's function signature.
        // The component calls: mutate({ projectId, title, ... })
        // The service needs: createEpic(projectId, { title, ... })
        mutationFn: (variables) => {
            const { projectId: pId, ...epicData } = variables;
            return epicService.createEpic(pId, epicData);
        },

        onSuccess: () => {
            console.log(`[useCreateEpic] Success. Invalidating epics for project: ${projectId}`);
            queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
        },
        onError: (error) => {
            console.error("[useCreateEpic] Error creating epic:", error);
        },
    });
};