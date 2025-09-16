import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { type Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';


export function useSocket(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  

  const socketRef = useRef<Socket | null>(null);

  const { getToken } = useAuth();

  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      try {
      
        socket = await getSocket(() => getToken());
        socketRef.current = socket;


        socket.on('connect', () => {
          setIsConnected(true);
       
          socket.emit('join-canvas', roomId);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });
        

      } catch (error) {
        console.error("Failed to establish socket connection:", error);
      }
    };

    connect();

  
    return () => {
      disconnectSocket();
      setIsConnected(false);
      socketRef.current = null;
    };
  }, [roomId, getToken]);

  return { socket: socketRef.current, isConnected };
}
