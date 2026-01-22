// frontend/src/features/epics/hooks/useUpdateEpic.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import epicService from '../services/epicService';

/**
 * React Query hook for updating an existing epic.
 * @param {string} projectId - The ID of the project for cache invalidation.
 * @returns The result of the useMutation hook.
 */
export const useUpdateEpic = (projectId) => {
    const queryClient = useQueryClient();

    return useMutation({
        // UPDATED: The mutation function adapts the variables to the service signature.
        // The component calls: mutate({ epicId, title, ... })
        // The service needs: updateEpic(epicId, { title, ... })
        mutationFn: (variables) => {
            const { epicId, ...updateData } = variables;
            return epicService.updateEpic(epicId, updateData);
        },

        onSuccess: (data, variables) => {
            console.log(`[useUpdateEpic] Success. Invalidating caches.`);
            queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
            queryClient.invalidateQueries({ queryKey: ['epic', variables.epicId] });
        },
        onError: (error) => {
            console.error("[useUpdateEpic] Error updating epic:", error);
        },
    });
};