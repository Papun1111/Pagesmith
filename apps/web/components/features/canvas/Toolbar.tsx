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
    <div className="flex items-center gap-3 w-full">
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
          className="text-sm font-semibold h-8 w-48 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-md"
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="group flex items-center gap-2 cursor-pointer p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          title="Click to edit title"
        >
          <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{title || "Untitled Canvas"}</h1>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-500"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </span>
        </div>
      )}
      <div className="flex-grow" />
      
      <ShareDialog canvas={canvas} onCanvasUpdate={onCanvasUpdate}>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-semibold rounded-md border-slate-200 dark:border-white/10 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          Share
        </Button>
      </ShareDialog>

      {/* --- NEW: Delete Button and Confirmation Dialog --- */}
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-md transition-colors" title="Delete Canvas">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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

