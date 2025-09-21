'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Copy, X, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import type { AccessType, Canvas } from '@/types';

interface ShareDialogProps {
  children: React.ReactNode;
  canvas: Canvas;
  onCanvasUpdate: (updatedCanvas: Canvas) => void;
}

export function ShareDialog({ children, canvas, onCanvasUpdate }: ShareDialogProps) {
  const { getToken, userId: currentUserId } = useAuth();
  const [newCollaboratorId, setNewCollaboratorId] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('read');
  const [isAdding, setIsAdding] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAddCollaborator = async () => {
    if (!newCollaboratorId.trim()) {
      toast.error('Please enter a User ID.');
      return;
    }
    // Add validation to prevent adding the owner or an existing collaborator.
    if (newCollaboratorId === currentUserId) {
      toast.error("You cannot add yourself as a collaborator.");
      return;
    }
    if (canvas.collaborators.some(c => c.userId === newCollaboratorId)) {
      toast.error("This user is already a collaborator.");
      return;
    }

    setIsAdding(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const updatedCanvas = await apiClient.addCollaborator(canvas._id, newCollaboratorId, accessType, token);
      onCanvasUpdate(updatedCanvas); // Update parent state
      toast.success('Collaborator added successfully!');
      setNewCollaboratorId('');
    } catch (error: unknown) {
      if(error instanceof Error)
      toast.error(error.message || 'Failed to add collaborator.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const updatedCanvas = await apiClient.removeCollaborator(canvas._id, collaboratorId, token);
      onCanvasUpdate(updatedCanvas);
      toast.success('Collaborator removed.');
    } catch (error: unknown) {
      if(error instanceof Error)
      toast.error(error.message || 'Failed to remove collaborator.');
    }
  };
  
  // Use a more robust copy-to-clipboard method.
  const copyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Your User ID has been copied to the clipboard.");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset visual feedback after 2 seconds
    } catch (err) {
      toast.error('Failed to copy ID.');
    }
    document.body.removeChild(textArea);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share {canvas.title}</DialogTitle>
          <DialogDescription>
            Invite others to collaborate by sharing their User ID.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground mr-2">Your User ID (for sharing):</p>
            <Button onClick={() => currentUserId && copyToClipboard(currentUserId)} variant="ghost" size="sm" disabled={isCopied}>
              {isCopied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {isCopied ? 'Copied!' : 'Copy Your ID'}
            </Button>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add New Collaborator</h4>
            <div className="flex items-center gap-2">
              <Input
                id="collaboratorId"
                value={newCollaboratorId}
                onChange={(e) => setNewCollaboratorId(e.target.value)}
                placeholder="Enter User ID"
              />
              <Select value={accessType} onValueChange={(value: AccessType) => setAccessType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Can view</SelectItem>
                  <SelectItem value="write">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddCollaborator} disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">People with Access</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm truncate" title={canvas.ownerId}>Owner ({canvas.ownerId.slice(0, 15)}...)</p>
                <p className="text-sm text-muted-foreground">Owner</p>
              </div>
              {canvas.collaborators.map((c) => (
                <div key={c.userId} className="flex items-center justify-between">
                  <p className="text-sm truncate" title={c.userId}>{c.userId.slice(0, 15)}...</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{c.accessType === 'read' ? 'Can view' : 'Can edit'}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveCollaborator(c.userId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

