'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShareDialog } from './ShareDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';

interface ToolbarProps {
  canvas: Canvas;
  onCanvasUpdate: (updatedCanvas: Canvas) => void;
}

export function Toolbar({ canvas, onCanvasUpdate }: ToolbarProps) {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [title, setTitle] = useState(canvas.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // A check to ensure only the owner can see and use the delete functionality.
  const isOwner = canvas.ownerId === userId;

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
      onCanvasUpdate(updatedCanvas);
      toast.success('Canvas title updated successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update canvas title.');
        setTitle(originalTitle);
      }
    }
  };

  const handleDeleteCanvas = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");
      
      await apiClient.deleteCanvas(canvas._id, token);
      toast.success("Canvas deleted successfully!");
      // Redirect to the dashboard after a successful deletion.
      router.push('/dashboard');
    } catch (error: unknown) {
      if(error instanceof Error){
      toast.error(error.message || "Failed to delete canvas.");
      setIsDeleting(false);
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
              setTitle(canvas.title);
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
      
      <ShareDialog canvas={canvas} onCanvasUpdate={onCanvasUpdate}>
        <Button size="sm" variant="outline">Share</Button>
      </ShareDialog>

      {/* --- NEW: Delete Button and Confirmation Dialog --- */}
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                canvas and all of its content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCanvas} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

