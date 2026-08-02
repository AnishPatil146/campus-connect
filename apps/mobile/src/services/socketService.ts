import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:10000/events' : 'http://localhost:10000/events';
  }
  return 'https://api.campusconnect.com/events';
};

class SocketService {
  private socket: Socket | null = null;
  private queryClient: QueryClient | null = null;
  public isConnected: boolean = false;
  public isReconnecting: boolean = false;

  init(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  connect() {
    const { token, user, tenantId } = useAuthStore.getState();
    if (!token) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(getSocketUrl(), {
      auth: { token },
      query: { token, collegeId: tenantId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.isReconnecting = false;
      if (user?.id) {
        this.socket?.emit('join', user.id);
      }
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('⚡ Socket reconnecting...');
      this.isReconnecting = true;
      const freshToken = useAuthStore.getState().token;
      if (freshToken && this.socket) {
        this.socket.auth = { token: freshToken };
      }
    });

    this.socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      this.isConnected = false;
    });

    // Real-time events contract
    this.socket.on('attendance:updated', (data) => {
      console.log('⚡ [SOCKET EVENT] attendance:updated', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['student', 'attendance'] });
        this.queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
        this.queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
        this.queryClient.invalidateQueries({ queryKey: ['attendance'] });
        this.queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    });

    this.socket.on('notes:uploaded', (data) => {
      console.log('⚡ [SOCKET EVENT] notes:uploaded', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['student', 'notes'] });
        this.queryClient.invalidateQueries({ queryKey: ['teacher', 'notes'] });
        this.queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    });

    this.socket.on('result:published', (data) => {
      console.log('⚡ [SOCKET EVENT] result:published', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['student', 'results'] });
        this.queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
        this.queryClient.invalidateQueries({ queryKey: ['results'] });
      }
    });

    this.socket.on('timetable:published', (data) => {
      console.log('⚡ [SOCKET EVENT] timetable:published', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['student', 'timetable'] });
        this.queryClient.invalidateQueries({ queryKey: ['timetable'] });
      }
    });

    this.socket.on('notification:new', (data) => {
      console.log('⚡ [SOCKET EVENT] notification:new', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
        this.queryClient.invalidateQueries({ queryKey: ['teacher', 'notifications'] });
        this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    this.socket.on('announcement:new', (data) => {
      console.log('⚡ [SOCKET EVENT] announcement:new', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['announcements'] });
        this.queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
      }
    });
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isReconnecting = false;
    }
  }
}

export const socketService = new SocketService();
