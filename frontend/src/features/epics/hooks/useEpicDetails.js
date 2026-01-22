import { useQuery } from '@tanstack/react-query';
import epicService from '../services/epicService';

export const useEpicDetails = (epicId) => {
    return useQuery({
        queryKey: ['epic', epicId],
        queryFn: () => epicService.getEpicById(epicId),
        enabled: !!epicId, // The query will not run until an epicId is available
    });
};