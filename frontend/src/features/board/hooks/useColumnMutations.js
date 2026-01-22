import { useMutation, useQueryClient } from '@tanstack/react-query';
import boardService from '../services/boardService'; // Adjust path if needed
import { toast } from 'react-hot-toast';

export const useColumnMutations = (boardId) => {
    const queryClient = useQueryClient();

    // NOTE: For debugging purposes, assuming `newColumnData` or `updateData` might contain `userId`
    // If `userId` is passed via headers or other means not visible here,
    // you might need to inspect your `boardService` or network requests.

    const createColumnMutation = useMutation({
        mutationFn: (newColumnData) => {
            console.log('Attempting to create column. Board ID:', boardId, 'New column data:', newColumnData);
            // If userId is expected within newColumnData, log it:
            // console.log('Potential userId in newColumnData:', newColumnData.userId);
            return boardService.createColumn(boardId, newColumnData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['board', boardId]);
            toast.success('Column created successfully');
        },
        onError: (error) => {
            console.error('Failed to create column:', error);
            toast.error(`Failed to create column: ${error.message}`);
        }
    });

    const updateColumnMutation = useMutation({
        mutationFn: ({ columnId, updateData }) => {
            console.log('Attempting to update column. Column ID:', columnId, 'Update data:', updateData);
            // If userId is expected within updateData, log it:
            // console.log('Potential userId in updateData:', updateData.userId);
            return boardService.updateColumn(columnId, updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['board', boardId]);
            toast.success('Column updated successfully');
        },
        onError: (error) => {
            console.error('Failed to update column:', error);
            toast.error(`Failed to update column: ${error.message}`);
        }
    });

    const deleteColumnMutation = useMutation({
        mutationFn: (columnId) => {
            console.log('Attempting to delete column. Column ID:', columnId);
            // If userId is implicitly sent with delete request (e.g., via headers),
            // you might need to inspect network requests or boardService.deleteColumn implementation.
            return boardService.deleteColumn(columnId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['board', boardId]);
            toast.success('Column deleted successfully');
        },
        onError: (error) => {
            console.error('Failed to delete column:', error);
            toast.error(`Failed to delete column: ${error.message}`);
        }
    });

    return {
        createColumnMutation,
        updateColumnMutation,
        deleteColumnMutation
    };
};
