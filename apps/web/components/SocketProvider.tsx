'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({ 
  socket: null, 
  isConnected: false,
  reconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const initSocket = () => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:10000/events';
    const token = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
    
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token,
      },
    } as any);

    s.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        s.emit('join', user.id);
      }
    });

    s.on('reconnect_attempt', () => {
      const freshToken = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
      if (freshToken) {
        s.auth = { token: freshToken };
      }
    });

    s.on('connect_error', (err) => {
      console.warn('[SocketProvider] Connection error:', err.message);
      setIsConnected(false);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(s);
  };

  useEffect(() => {
    initSocket();
    return () => {
      if (socket) socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const reconnect = () => {
    if (socket) {
      const freshToken = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
      if (freshToken) socket.auth = { token: freshToken };
      socket.connect();
    } else {
      initSocket();
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
