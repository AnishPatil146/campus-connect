import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { AuthLoadingScreen } from '../screens/auth/AuthLoadingScreen';
import { StudentTabNavigator } from './StudentTabNavigator';
import { TeacherTabNavigator } from './TeacherTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import { StudentTimetableScreen } from '../screens/student/StudentTimetableScreen';
import { StudentResultsScreen } from '../screens/student/StudentResultsScreen';
import { TeacherNotesScreen } from '../screens/teacher/TeacherNotesScreen';
import { TeacherResultsScreen } from '../screens/teacher/TeacherResultsScreen';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, user, isLoading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Initializing Campus Connect Mobile..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        </>
      ) : user?.role === 'ADMIN' ? (
        <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
      ) : user?.role === 'TEACHER' ? (
        <>
          <Stack.Screen name="TeacherApp" component={TeacherTabNavigator} />
          <Stack.Screen name="TeacherNotes" component={TeacherNotesScreen} />
          <Stack.Screen name="TeacherResults" component={TeacherResultsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="StudentApp" component={StudentTabNavigator} />
          <Stack.Screen name="StudentTimetable" component={StudentTimetableScreen} />
          <Stack.Screen name="StudentResults" component={StudentResultsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
