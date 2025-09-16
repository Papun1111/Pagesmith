'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';

// Define the props for the Toolbar component.
// This interface explicitly states that the component expects a `canvas` object,
// which resolves the original TypeScript error.
interface ToolbarProps {
  canvas: Canvas;
}

export function Toolbar({ canvas }: ToolbarProps) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState(canvas.title);
  const [isEditing, setIsEditing] = useState(false);

  // Handles the logic to update the canvas title.
  const handleTitleChange = async () => {
    // No need to make an API call if the title hasn't changed.
    if (title === canvas.title) {
      setIsEditing(false);
      return;
    }

    const originalTitle = canvas.title;
    // Optimistically update the UI while the API call is in progress.
    setIsEditing(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed. Please sign in.");
      
      await apiClient.updateCanvasTitle(canvas._id, title, token);
      console.log('Canvas title updated successfully!');
      // Note: In a more complex app, you might use a state manager (like Zustand or Jotai)
      // to update the canvas title globally here.
    } catch (error: any) {
      console.error('Failed to update canvas title:', error.message || 'An unknown error occurred.');
      // Revert the title back to the original on error.
      setTitle(originalTitle);
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
      {/* Add other toolbar buttons here (e.g., Share, Export) */}
      <Button size="sm" variant="outline">Share</Button>
    </div>
  );
}

