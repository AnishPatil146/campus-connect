import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TimetableScreen } from '../screens/timetable/TimetableScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Home, Calendar, TrendingUp, BookOpen, Bell, User, Sparkles } from 'lucide-react-native';

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
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
