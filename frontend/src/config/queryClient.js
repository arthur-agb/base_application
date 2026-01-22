// src/queryClient.js (New File)
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // You can set global default options here if needed
      // For example:
      // staleTime: 1000 * 60 * 5, // 5 minutes
      // refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;