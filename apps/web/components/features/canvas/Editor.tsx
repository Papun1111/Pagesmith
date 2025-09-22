'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { getSocket, disconnectSocket } from '@/lib/socket';
import { useDebounce } from '@/hooks/useDebounce';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  
  const socketRef = useRef<Socket | null>(null);
  // Use a ref to track if a content change was made by the local user or received from the socket.
  // This is crucial to prevent the client from echoing updates back to the server.
  const isLocalChange = useRef(false);
  
  const debouncedContent = useDebounce(content, 500);
  const { getToken } = useAuth();

  // Effect to establish and clean up the WebSocket connection.
  useEffect(() => {
    const connect = async () => {
      try {
        const socket = await getSocket(() => getToken());
        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          toast.success("Real-time connection established!");
          socket.emit('join-canvas', canvasId);
        });

        socket.on('canvas-updated', (newContent: string) => {
          // When content is received from the server, flag it as a non-local change.
          isLocalChange.current = false;
          setContent(newContent);
        });
        
        socket.on('disconnect', () => {
          setIsConnected(false);
          toast.error("Real-time connection lost. Reconnecting...");
        });

        // Handle connection errors
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

    // Cleanup function: Disconnect the socket when the component unmounts.
    return () => {
      disconnectSocket();
    };
  }, [canvasId, getToken]);

  // Effect to emit content updates when the debounced content changes.
  useEffect(() => {
    // Only emit updates if the socket is connected and the change was made locally.
    if (isConnected && socketRef.current && isLocalChange.current) {
      socketRef.current.emit('canvas-update', { canvasId, content: debouncedContent });
      // Reset the flag after emitting.
      isLocalChange.current = false;
    }
  }, [debouncedContent, canvasId, isConnected]);

  const handleContentChange = (newContent: string) => {
    // When the user types, flag the change as a local one before updating the state.
    isLocalChange.current = true;
    setContent(newContent);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full">
      {/* Input Pane */}
      <Card className="flex flex-col h-full">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full flex-grow p-4 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Start typing your markdown..."
        />
        <CardFooter className="py-2 px-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
        </CardFooter>
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

