import { useQuery } from '@tanstack/react-query';
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
    // CRITICAL FIX: staleTime was 5 minutes (300_000ms), which meant that
    // invalidateQueries() had no visible effect because TanStack Query only
    // re-fetches STALE queries on invalidation. A 5min staleTime meant that
    // any query fetched within the last 5min was still considered "fresh"
    // and would NOT refetch even when invalidated — making all socket-driven
    // dashboard updates completely invisible until the user navigated away
    // and back. Setting staleTime to 0 means every query is immediately
    // stale and any invalidation triggers an immediate background refetch.
    staleTime: 0,
    // Keep data in memory for 2 minutes so switching tabs doesn't flash a
    // loading spinner — gcTime only affects garbage collection, not staleness.
    gcTime: 1000 * 60 * 2,
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
