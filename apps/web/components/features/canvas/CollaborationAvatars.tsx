'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Collaborator } from '@/types';

// Define the props for the component, using the shared Collaborator type.
interface CollaborationAvatarsProps {
  collaborators: Collaborator[];
}

/**
 * Displays a stack of avatars for users who are collaborators on the canvas.
 * On hover, it shows the user's ID.
 */
export function CollaborationAvatars({ collaborators }: CollaborationAvatarsProps) {
  // We'll show a maximum of 3 avatars, plus a counter for the rest.
  const maxVisibleAvatars = 3;
  const visibleCollaborators = collaborators.slice(0, maxVisibleAvatars);
  const hiddenCollaboratorsCount = collaborators.length - maxVisibleAvatars;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visibleCollaborators.map((collaborator) => (
          // FIX: Use `collaborator.userId` as the key, which exists on our global Collaborator type.
          // This resolves the TypeScript error.
          <Tooltip key={collaborator.userId}>
            <TooltipTrigger asChild>
              <Avatar className="border-2 border-white dark:border-gray-800">
                {/* We don't have user images yet, so we'll use a fallback. */}
                {/* You would replace this with <AvatarImage src={collaborator.imageUrl} /> */}
                <AvatarFallback>
                  {collaborator.userId.substring(5, 7).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>User ID: {collaborator.userId}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {hiddenCollaboratorsCount > 0 && (
          <Avatar className="border-2 border-white dark:border-gray-800">
            <AvatarFallback>+{hiddenCollaboratorsCount}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </TooltipProvider>
  );
}

