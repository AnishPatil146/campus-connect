import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { StudentTabNavigator } from './StudentTabNavigator';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, isLoading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Connecting Campus Connect Mobile V1..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Auth" component={LoginScreen} />
      ) : (
        <Stack.Screen name="StudentApp" component={StudentTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
