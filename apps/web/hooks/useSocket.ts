'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { getSocket, disconnectSocket } from '@/lib/socket';

/**
 * A custom React hook to manage a singleton Socket.IO connection for a given room.
 * It handles connecting, joining a room, and cleaning up the connection.
 * It also provides user feedback via toast notifications.
 *
 * @param roomId - The ID of the room to join (e.g., a canvasId).
 * @returns An object containing the socket instance and the connection status.
 */
export function useSocket(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!roomId) return;

    const connect = async () => {
      try {
        const socket = await getSocket(() => getToken());
        socketRef.current = socket;

        // --- Register Socket Event Listeners ---

        socket.on('connect', () => {
          setIsConnected(true);
          toast.success("Real-time connection established!");
          socket.emit('join-canvas', roomId);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          toast.error("Real-time connection lost. Reconnecting...");
        });

        socket.on('connect_error', (err) => {
          console.error("Socket connection error:", err);
          toast.error(`Connection failed: ${err.message}`);
        });

      } catch (error) {
        console.error("Failed to initialize socket:", error);
        toast.error("Could not establish real-time connection.");
      }
    };

    connect();

    // --- Cleanup Function ---
    // This runs when the component unmounts or the roomId/getToken changes.
    return () => {
      disconnectSocket();
    };
  }, [roomId, getToken]);

  return { socket: socketRef.current, isConnected };
}

