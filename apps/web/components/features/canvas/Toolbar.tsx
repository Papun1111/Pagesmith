'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';
import { toast } from 'sonner';
import { ShareDialog } from './ShareDialog';

// Define the props for the Toolbar component.
// It now includes `onCanvasUpdate` to allow this component to notify its
// parent (CanvasPage) when the canvas data has changed (e.g., after sharing).
interface ToolbarProps {
  canvas: Canvas;
  onCanvasUpdate: (updatedCanvas: Canvas) => void;
}

export function Toolbar({ canvas, onCanvasUpdate }: ToolbarProps) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState(canvas.title);
  const [isEditing, setIsEditing] = useState(false);

  // Handles the logic to update the canvas title.
  const handleTitleChange = async () => {
    if (title === canvas.title) {
      setIsEditing(false);
      return;
    }

    const originalTitle = canvas.title;
    setIsEditing(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed. Please sign in.");
      
      const updatedCanvas = await apiClient.updateCanvasTitle(canvas._id, title, token);
      onCanvasUpdate(updatedCanvas); // Update the state in the parent component.
      toast.success('Canvas title updated successfully!');
    } catch (error: unknown) {
      if(error instanceof Error){
      toast.error(error.message || 'Failed to update canvas title.');
      // Revert the title back to the original on error.
      setTitle(originalTitle);
      }
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      {isEditing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleChange();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setTitle(canvas.title); // Revert on escape
            }
          }}
          autoFocus
          className="text-lg font-bold h-9"
        />
      ) : (
        <h1
          onClick={() => setIsEditing(true)}
          className="text-lg font-bold cursor-pointer truncate p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Click to edit title"
        >
          {title || "Untitled Canvas"}
        </h1>
      )}
      <div className="flex-grow" />
      
      {/* The ShareDialog now wraps the Share button, making it interactive. */}
      {/* We pass the canvas data and the onCanvasUpdate function down to it. */}
      <ShareDialog canvas={canvas} onCanvasUpdate={onCanvasUpdate}>
        <Button size="sm" variant="outline">Share</Button>
      </ShareDialog>
    </div>
  );
}

