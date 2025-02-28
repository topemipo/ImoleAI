import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';


export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // const { checkRateLimit } = useRateLimit();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? '', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    // Middleware for rate limiting
    // socket.use(async ([event, ...args], next) => {
    //   try {
    //     await checkRateLimit();
    //     next();
    //   } catch (error) {
    //     next(new Error('Rate limit exceeded'));
    //   }
    // });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
};