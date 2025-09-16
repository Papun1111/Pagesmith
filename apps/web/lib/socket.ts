import { io, Socket } from 'socket.io-client';

// Use an environment variable for your WebSocket server URL.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export const getSocket = async (getAuthToken: () => Promise<string | null>): Promise<Socket> => {
  if (socket) {
    return socket;
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error('Cannot initialize socket: user is not authenticated.');
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected successfully:', socket?.id);
  });

 
  socket.on('connect_error', (err: Error) => {
    console.error('Socket.IO connection error:', err.message);
  });

  return socket;
};


export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
  console.log('Socket.IO disconnected.');
};

