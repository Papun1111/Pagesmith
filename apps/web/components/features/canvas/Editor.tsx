'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useSocket } from '@/hooks/useSocket';
import { useDebounce } from '@/hooks/useDebounce';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EditorProps {
  canvasId: string;
  initialContent: string;
}

/**
 * The main editor component for the canvas. It now uses the `useSocket` hook
 * to manage its real-time connection and provides syntax highlighting.
 */
export function Editor({ canvasId, initialContent }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  
  // Use the custom hook to manage the socket connection.
  // This replaces all the manual connection logic.
  const { socket, isConnected } = useSocket(canvasId);

  // This ref is crucial to prevent the editor from sending content back to the
  // server that it just received (an "echo").
  const isLocalChange = useRef(false);
  const debouncedContent = useDebounce(content, 500);

  // Effect to listen for incoming content updates from other users.
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (newContent: string) => {
      // When we receive an update, we flag that it was not a local change.
      isLocalChange.current = false;
      setContent(newContent);
    };

    socket.on('canvas-updated', handleUpdate);

    // Clean up the event listener when the component unmounts or the socket changes.
    return () => {
      socket.off('canvas-updated', handleUpdate);
    };
  }, [socket]);

  // Effect to send local content updates to the server.
  useEffect(() => {
    // We only send an update if the connection is live, the socket exists,
    // and the change was made by the local user.
    if (isConnected && socket && isLocalChange.current) {
      socket.emit('canvas-update', { canvasId, content: debouncedContent });
      // Reset the flag after sending the update.
      isLocalChange.current = false;
    }
  }, [debouncedContent, canvasId, isConnected, socket]);

  const handleContentChange = (newContent: string) => {
    // When the user types in the textarea, we flag the change as a local one.
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
          className="w-full flex-grow p-4 border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
          placeholder="Start typing your markdown..."
        />
        <CardFooter className="py-2 px-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
        </CardFooter>
      </Card>

      {/* Preview Pane with Syntax Highlighting */}
      <Card className="h-full overflow-y-auto">
        <article className="prose dark:prose-invert max-w-none p-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const { children, className, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...rest} className={className}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </Card>
    </div>
  );
}

