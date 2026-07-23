import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/events';
  }
  return 'http://localhost:4000/events';
};

class SocketService {
  private socket: Socket | null = null;
  private queryClient: QueryClient | null = null;

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
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket?.id);
      if (user?.id) {
        this.socket?.emit('join', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
    });

    // Real-time events contract
    this.socket.on('attendance:updated', (data) => {
      console.log('⚡ [SOCKET EVENT] attendance:updated', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['attendance'] });
        this.queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    });

    this.socket.on('notes:uploaded', (data) => {
      console.log('⚡ [SOCKET EVENT] notes:uploaded', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    });

    this.socket.on('result:published', (data) => {
      console.log('⚡ [SOCKET EVENT] result:published', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['results'] });
      }
    });

    this.socket.on('timetable:published', (data) => {
      console.log('⚡ [SOCKET EVENT] timetable:published', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['timetable'] });
      }
    });

    this.socket.on('notification:new', (data) => {
      console.log('⚡ [SOCKET EVENT] notification:new', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    this.socket.on('announcement:new', (data) => {
      console.log('⚡ [SOCKET EVENT] announcement:new', data);
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['announcements'] });
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
