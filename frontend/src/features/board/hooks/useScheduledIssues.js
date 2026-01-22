import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

export const useScheduledIssues = (boardId) => {
    const queryClient = useQueryClient();

    const { data: scheduledIssues, isLoading, error } = useQuery({
        queryKey: ['scheduledIssues', boardId],
        queryFn: async () => {
            if (!boardId) return [];
            const response = await api.get(`/scheduled-issues/board/${boardId}`);
            return response.data;
        },
        enabled: !!boardId
    });

    const createScheduledIssueMutation = useMutation({
        mutationFn: async (newSchedule) => {
            const response = await api.post('/scheduled-issues', newSchedule);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledIssues', boardId]);
        }
    });

    const updateScheduledIssueMutation = useMutation({
        mutationFn: async ({ id, ...updateData }) => {
            const response = await api.put(`/scheduled-issues/${id}`, updateData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledIssues', boardId]);
        }
    });

    const deleteScheduledIssueMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/scheduled-issues/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledIssues', boardId]);
        }
    });

    return {
        scheduledIssues,
        isLoading,
        error,
        createScheduledIssueMutation,
        updateScheduledIssueMutation,
        deleteScheduledIssueMutation
    };
};
