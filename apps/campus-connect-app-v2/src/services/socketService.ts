import { io, Socket } from 'socket.io-client';
import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:10000' : 'http://localhost:10000';
  }
  return 'https://campus-connect-tyz7.onrender.com';
};

class SocketService {
  private socket: Socket | null = null;
  private queryClient: QueryClient | null = null;
  private reconnectAttempts = 0;

  init(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  connect() {
    const { token, tenantId, user } = useAuthStore.getState();
    if (!token) return;

    if (this.socket?.connected) {
      this.socket.disconnect();
    }

    const socketUrl = getSocketUrl();
    this.socket = io(`${socketUrl}/events`, {
      auth: {
        token,
        tenantId: tenantId || 'college-a',
        role: user?.role,
        userId: user?.id,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      // Join tenant & role rooms
      if (tenantId) {
        this.socket?.emit('join:room', `college:${tenantId}`);
      }
      if (user?.id) {
        this.socket?.emit('join:room', `user:${user.id}`);
      }
      if (user?.role) {
        this.socket?.emit('join:room', `role:${user.role}`);
      }
    });

    this.socket.on('disconnect', () => {
      // Disconnected
    });

    this.socket.on('connect_error', () => {
      this.reconnectAttempts++;
    });

    // Real-Time Event Handlers -> Invalidate TanStack Query Caches
    this.socket.on('attendance:updated', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['attendance'] });
      this.queryClient?.invalidateQueries({ queryKey: ['student-overview'] });
      this.queryClient?.invalidateQueries({ queryKey: ['teacher-overview'] });
    });

    this.socket.on('notes:uploaded', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['notes'] });
    });

    this.socket.on('result:published', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['results'] });
      this.queryClient?.invalidateQueries({ queryKey: ['student-overview'] });
    });

    this.socket.on('timetable:published', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['timetable'] });
    });

    this.socket.on('notification:new', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['notifications'] });
      this.queryClient?.invalidateQueries({ queryKey: ['unread-notifications'] });
    });

    this.socket.on('announcement:new', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['announcements'] });
    });

    this.socket.on('event:created', (data) => {
      this.queryClient?.invalidateQueries({ queryKey: ['events'] });
    });

    this.socket.on('system:health', (data) => {
      this.queryClient?.setQueryData(['system-health'], data);
    });
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
