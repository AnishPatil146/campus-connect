import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/useAuthStore';

interface UseApiDataOptions<T> {
  queryKey: any[];
  endpoint: string;
  enabled?: boolean;
  timeoutMs?: number;
  transformFn?: (data: any) => T;
}

export function useApiData<T = any>({
  queryKey,
  endpoint,
  enabled = true,
  timeoutMs = 10000,
  transformFn,
}: UseApiDataOptions<T>) {
  const tenantId = useAuthStore((state) => state.tenantId);
  const fullQueryKey = [...queryKey, tenantId];

  const query = useQuery<T>({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const res = await apiClient.get(endpoint, { timeout: timeoutMs });
      const rawData = res.data?.data ?? res.data;
      if (transformFn) {
        return transformFn(rawData);
      }
      return rawData as T;
    },
    enabled,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const rawData = query.data;
  let isEmpty = false;

  if (rawData === null || rawData === undefined) {
    isEmpty = true;
  } else if (Array.isArray(rawData) && rawData.length === 0) {
    isEmpty = true;
  } else if (typeof rawData === 'object' && Object.keys(rawData).length === 0) {
    isEmpty = true;
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
