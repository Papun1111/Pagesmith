'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Socket } from 'socket.io-client';

import { getSocket, disconnectSocket } from '@/lib/socket';
import { useDebounce } from '@/hooks/useDebounce';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface EditorProps {
  canvasId: string;
  initialContent: string;
}

/**
 * The main editor component for the canvas. It handles real-time content synchronization
 * between multiple users via WebSockets.
 */
export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  
  // Use a ref to hold the socket instance to prevent re-renders from re-initializing it.
  const socketRef = useRef<Socket | null>(null);
  
  // Debounce the content to avoid sending too many updates to the server.
  const debouncedContent = useDebounce(content, 500);
  
  const { getToken } = useAuth();

  // Effect to establish and clean up the WebSocket connection.
  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      try {
        // Get the socket instance using our singleton initializer.
        socket = await getSocket(() => getToken());
        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          // Join the specific room for this canvas.
          socket.emit('join-canvas', canvasId);
        });

        // Listen for content updates from other users in the room.
        socket.on('canvas-updated', (newContent: string) => {
          setContent(newContent);
        });
        
        socket.on('disconnect', () => {
          setIsConnected(false);
        });

      } catch (error) {
        console.error("Failed to connect socket:", error);
      }
    };
    
    connect();

    // Cleanup function: Disconnect the socket when the component unmounts.
    return () => {
      disconnectSocket();
    };
  }, [canvasId, getToken]);

  // Effect to emit content updates when the debounced content changes.
  useEffect(() => {
    // Only emit updates if the socket is connected and the content is not the initial content.
    if (isConnected && socketRef.current && debouncedContent !== initialContent) {
      socketRef.current.emit('canvas-update', { canvasId, content: debouncedContent });
    }
  }, [debouncedContent, canvasId, isConnected, initialContent]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full">
      {/* Input Pane */}
      <Card className="flex flex-col h-full">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Start typing your markdown..."
        />
      </Card>

      {/* Preview Pane */}
      <Card className="h-full overflow-y-auto">
        <article className="prose dark:prose-invert max-w-none p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </Card>
    </div>
  );
}
