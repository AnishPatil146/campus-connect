import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { socketService } from './src/services/socketService';
import { useAuthStore } from './src/store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 mins cache
      gcTime: 1000 * 60 * 60 * 24, // 24 hours offline persistence
    },
  },
});

export default function App() {
  const token = useAuthStore((state) => state.token);
  const tenantId = useAuthStore((state) => state.tenantId);

  useEffect(() => {
    socketService.init(queryClient);
    if (token) {
      socketService.connect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [token, tenantId]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#020817" />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
