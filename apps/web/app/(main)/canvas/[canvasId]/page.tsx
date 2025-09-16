'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Editor } from '@/components/features/canvas/Editor';
import { Toolbar } from '@/components/features/canvas/Toolbar';
import { CollaborationAvatars } from '@/components/features/canvas/CollaborationAvatars';
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The main page for viewing and editing a specific canvas.
 * It fetches the canvas data and orchestrates the editor, toolbar,
 * and collaboration components.
 */
export default function CanvasPage({ params }: { params: { canvasId: string } }) {
  const { canvasId } = params;
  const { getToken } = useAuth();

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCanvasData = async () => {
      if (!canvasId) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not found.');
        }
        const fetchedCanvas = await apiClient.getCanvasById(canvasId, token);
        setCanvas(fetchedCanvas);
      } catch (err: any) {
        console.error('Failed to fetch canvas:', err);
        setError(err.message || 'An unknown error occurred while loading the canvas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvasData();
  }, [canvasId, getToken]);

  // Loading State: Show skeletons for a better user experience.
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Error State: Display a clear error message.
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Success State: Render the full canvas editor.
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
        <Toolbar canvas={canvas} />
        <CollaborationAvatars collaborators={canvas.collaborators} />
      </header>
      <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Editor canvasId={canvas._id} initialContent={canvas.content} />
      </main>
    </div>
  );
}
