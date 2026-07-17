'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:10000/events';
    const s = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join', user.id);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
