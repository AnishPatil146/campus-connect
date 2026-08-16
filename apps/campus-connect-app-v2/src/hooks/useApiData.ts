import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/useAuthStore';

export function useApiQuery<T>(
  key: string | (string | number | undefined)[],
  url: string,
  params?: Record<string, any>,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const token = useAuthStore((state) => state.token);
  const tenantId = useAuthStore((state) => state.tenantId);

  const queryKey = Array.isArray(key) ? [...key, tenantId] : [key, tenantId];

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get(url, { params });
      return response.data?.data ?? response.data;
    },
    enabled: !!token && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 1000 * 60 * 2,
    retry: 2,
  });
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: (string | string[])[]
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({
            queryKey: Array.isArray(key) ? key : [key],
          });
        });
      }
    },
  });
}
