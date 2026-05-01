import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const s = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('[Socket] connesso');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] disconnesso');
    });

    s.on('connect_error', (err) => {
      console.error('[Socket] errore connessione:', err.message);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
