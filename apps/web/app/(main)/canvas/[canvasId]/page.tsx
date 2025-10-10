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
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames


// NOTE: To use the 'Poppins' font, please add the following to your HTML head:
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet">


export default function CanvasPage() {
  const params = useParams();
  const canvasId = params.canvasId as string;
  const { getToken } = useAuth();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State to track screen size for responsive layout
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen size on mount and on resize
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


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
      // Added responsive padding
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="p-4 md:p-8 h-full bg-[#F0F0F0]">
        <Skeleton className="h-12 w-2/3 md:w-1/3 mb-4 bg-gray-300" />
        <Skeleton className="h-[calc(100%-4rem)] w-full bg-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      // Added responsive padding
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex items-center justify-center h-full text-red-700 bg-[#F0F0F0] p-4 md:p-8">
        <div className="flex items-center gap-4 border border-red-500 bg-red-100 p-4 font-bold text-center">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex items-center justify-center h-full bg-[#F0F0F0] p-4">
        <p className="font-black text-xl md:text-2xl text-center">Canvas not found.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex flex-col h-screen bg-[#F0F0F0] text-[#111111]">
      {/* Header with responsive stacking */}
      <header className="flex-shrink-0 p-3 md:p-4 border-b border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <Toolbar canvas={canvas} onCanvasUpdate={onCanvasUpdate} />
        <CollaborationAvatars collaborators={canvas.collaborators} />
      </header>

      {/* Resizable panel group with dynamic direction */}
      <ResizablePanelGroup 
        direction={isMobile ? "vertical" : "horizontal"} 
        className="flex-grow"
      >
        <ResizablePanel defaultSize={isMobile ? 65 : 75}>
          <main className="h-full overflow-y-auto p-2">
            <Editor canvasId={canvas._id} initialContent={canvas.content} />
          </main>
        </ResizablePanel>
        
        {/* Resizable handle with dynamic styling */}
        <ResizableHandle
          withHandle
          className={cn(
            "bg-transparent hover:bg-black/10 transition-colors",
            isMobile
              ? "border-y-2 h-4" // Horizontal handle for vertical layout
              : "border-x-2 w-4"  // Vertical handle for horizontal layout
          )}
        />
        
        <ResizablePanel defaultSize={isMobile ? 35 : 25} minSize={isMobile ? 30 : 20} maxSize={isMobile ? 50 : 40}>
          <AIAssistantPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}