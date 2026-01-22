import { useQuery } from '@tanstack/react-query';
import epicService from '../services/epicService';

export const useEpicIssues = (epicId) => {
    return useQuery({
        queryKey: ['issues', { epicId }], // Unique key for issues related to a specific epic
        queryFn: () => epicService.getEpicIssues(epicId),
        enabled: !!epicId,
    });
};