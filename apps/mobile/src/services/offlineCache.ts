import AsyncStorage from '@react-native-async-storage/async-storage';

export const OFFLINE_KEYS = {
  TIMETABLE: 'cc_cache_timetable',
  NOTES: 'cc_cache_notes',
  ATTENDANCE: 'cc_cache_attendance',
  PROFILE: 'cc_cache_profile',
};

export const saveOfflineData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save offline data:', e);
  }
};

export const getOfflineData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonStr = await AsyncStorage.getItem(key);
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (e) {
    console.error('Failed to retrieve offline data:', e);
    return null;
  }
};
