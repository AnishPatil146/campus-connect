import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getCollegeName } from '@campus-connect/utils';

export default function App() {
  // Use the system theme preference as the initial state
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemScheme === 'dark');

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dynamic theme colors
  const theme = {
    background: isDarkMode ? '#0F172A' : '#F8FAFC',
    cardBackground: isDarkMode ? '#1E293B' : '#FFFFFF',
    textMain: isDarkMode ? '#F8FAFC' : '#0F172A',
    textSub: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    buttonText: isDarkMode ? '#0F172A' : '#F8FAFC',
    buttonBg: isDarkMode ? '#38BDF8' : '#2563EB',
    collegeDot: isDarkMode ? '#38BDF8' : '#2563EB',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Main Logo Card */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={[styles.title, { color: theme.textMain }]}>Campus Connect Mobile</Text>
        <Text style={[styles.subtitle, { color: theme.textSub }]}>Connecting Campus Systems</Text>
      </View>

      {/* College List Card */}
      <View style={[styles.listCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Active Colleges:</Text>
        
        <View style={styles.collegeRow}>
          <Text style={[styles.bullet, { color: theme.collegeDot }]}>•</Text>
          <Text style={[styles.collegeName, { color: theme.textMain }]}>{getCollegeName('college-a')}</Text>
        </View>

        <View style={styles.collegeRow}>
          <Text style={[styles.bullet, { color: theme.collegeDot }]}>•</Text>
          <Text style={[styles.collegeName, { color: theme.textMain }]}>{getCollegeName('college-b')}</Text>
        </View>

        <View style={styles.collegeRow}>
          <Text style={[styles.bullet, { color: theme.collegeDot }]}>•</Text>
          <Text style={[styles.collegeName, { color: theme.textMain }]}>{getCollegeName('college-c')}</Text>
        </View>
      </View>

      {/* Theme Toggle Button */}
      <TouchableOpacity 
        style={[styles.toggleButton, { backgroundColor: theme.buttonBg }]} 
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleButtonText, { color: theme.buttonText }]}>
          {isDarkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  logoBadge: {
    height: 48,
    width: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  listCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  collegeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  bullet: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 22,
  },
  collegeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
