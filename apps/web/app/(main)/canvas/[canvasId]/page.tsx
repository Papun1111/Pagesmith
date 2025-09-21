'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Editor } from '@/components/features/canvas/Editor';
import { Toolbar } from '@/components/features/canvas/Toolbar';
import { CollaborationAvatars } from '@/components/features/canvas/CollaborationAvatars';
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AIAssistantPanel } from '@/components/features/ai/AIAssistantPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function CanvasPage() {
  const params = useParams();
  const canvasId = params.canvasId as string;
  const { getToken } = useAuth();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onCanvasUpdate = (updatedCanvas: Canvas) => {
    setCanvas(updatedCanvas);
  };

  useEffect(() => {
    const fetchCanvasData = async () => {
      if (typeof canvasId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(canvasId)) {
        if (canvasId) {
          setError('Invalid Canvas ID provided in the URL.');
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication token not found.');
        const fetchedCanvas = await apiClient.getCanvasById(canvasId, token);
        setCanvas(fetchedCanvas);
      } catch (err: unknown) {
        console.error('Failed to fetch canvas:', err);
        // Updated error handling to be more robust
        if (err instanceof Error) {
          setError(err.message || 'An unknown error occurred while loading the canvas.');
        } else {
          setError('An unknown error occurred while loading the canvas.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvasData();
  }, [canvasId, getToken]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Canvas not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b flex items-center justify-between">
        <Toolbar canvas={canvas} onCanvasUpdate={onCanvasUpdate} />
        <CollaborationAvatars collaborators={canvas.collaborators} />
      </header>

      {/* Use a resizable panel group to house the editor and AI assistant */}
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={75}>
          <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto h-full">
            <Editor canvasId={canvas._id} initialContent={canvas.content} />
          </main>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          {/* Add the AI Assistant Panel here */}
          <AIAssistantPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

