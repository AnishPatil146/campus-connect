import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { StudentAttendanceScreen } from '../screens/student/StudentAttendanceScreen';
import { StudentTimetableScreen } from '../screens/student/StudentTimetableScreen';
import { StudentNotesScreen } from '../screens/student/StudentNotesScreen';
import { StudentResultsScreen } from '../screens/student/StudentResultsScreen';
import { StudentNotificationsScreen } from '../screens/student/StudentNotificationsScreen';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';
import { Home, CheckSquare, BookOpen, Bell, User, Calendar, Award } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const StudentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.bgCardBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Attendance"
        component={StudentAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Timetable"
        component={StudentTimetableScreen}
        options={{
          tabBarLabel: 'Timetable',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Notes"
        component={StudentNotesScreen}
        options={{
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Results"
        component={StudentResultsScreen}
        options={{
          tabBarLabel: 'Results',
          tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={StudentNotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
