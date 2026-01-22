// frontend/src/features/epics/hooks/useDeleteEpic.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import epicService from '../services/epicService';

/**
 * React Query hook for deleting an epic.
 * @param {string} projectId - The ID of the project for cache invalidation.
 * @returns The result of the useMutation hook.
 */
export const useDeleteEpic = (projectId) => {
    const queryClient = useQueryClient();

    return useMutation({
        // The `mutate` function will be called with the epicId to delete.
        mutationFn: epicService.deleteEpic,

        onSuccess: () => {
            console.log(`[useDeleteEpic] Success. Invalidating epics for project: ${projectId}`);
            // After successful deletion, invalidate the epics list to remove the deleted item.
            queryClient.invalidateQueries({ queryKey: ['epics', projectId] });
        },
        onError: (error) => {
            console.error("[useDeleteEpic] Error deleting epic:", error);
        },
    });
};