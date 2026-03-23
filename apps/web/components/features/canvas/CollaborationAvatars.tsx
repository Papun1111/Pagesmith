'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Collaborator } from '@/types';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Color palette — deterministic per collaborator index               */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  { bg: 'bg-violet-600', ring: 'ring-violet-400', text: 'text-white' },
  { bg: 'bg-sky-500', ring: 'ring-sky-300', text: 'text-white' },
  { bg: 'bg-amber-500', ring: 'ring-amber-300', text: 'text-white' },
  { bg: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-white' },
  { bg: 'bg-rose-500', ring: 'ring-rose-300', text: 'text-white' },
  { bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-300', text: 'text-white' },
  { bg: 'bg-cyan-500', ring: 'ring-cyan-300', text: 'text-white' },
  { bg: 'bg-orange-500', ring: 'ring-orange-300', text: 'text-white' },
];

function getInitials(userId: string): string {
  return userId.substring(5, 7).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  CollaborationAvatars                                               */
/* ------------------------------------------------------------------ */

interface CollaborationAvatarsProps {
  collaborators: Collaborator[];
}

export function CollaborationAvatars({ collaborators }: CollaborationAvatarsProps) {
  const maxVisible = 4;
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  if (collaborators.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mr-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hidden sm:inline">
            Live
          </span>
        </div>

        {/* Avatar stack */}
        <div className="flex items-center -space-x-2.5">
          {visible.map((collaborator, index) => {
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length]!;

            return (
              <Tooltip key={collaborator.userId} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.08,
                    }}
                    whileHover={{
                      scale: 1.2,
                      zIndex: 10,
                      transition: { type: 'spring', stiffness: 400, damping: 15 },
                    }}
                    className="relative"
                    style={{ zIndex: maxVisible - index }}
                  >
                    <Avatar
                      className={`
                        h-9 w-9
                        border-[2.5px] border-white dark:border-[#1a1a1a]
                        ring-2 ${color.ring} ring-offset-0
                        cursor-pointer
                        shadow-md
                        transition-shadow duration-200
                        hover:shadow-lg
                      `}
                    >
                      <AvatarFallback
                        className={`
                          ${color.bg} ${color.text}
                          text-xs font-black
                          select-none
                        `}
                      >
                        {getInitials(collaborator.userId)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a1a1a]" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="rounded-none border-2 border-black bg-white dark:border-white dark:bg-black px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full bg-emerald-500`} />
                    <span className="text-xs font-bold text-black dark:text-white">
                      {collaborator.userId.substring(0, 12)}...
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 border border-black/20 dark:border-white/20 px-1.5 py-0.5">
                      {collaborator.accessType}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Overflow counter */}
          {overflow > 0 && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: maxVisible * 0.08,
                  }}
                  whileHover={{
                    scale: 1.15,
                    zIndex: 10,
                    transition: { type: 'spring', stiffness: 400, damping: 15 },
                  }}
                >
                  <Avatar
                    className="h-9 w-9 border-[2.5px] border-white dark:border-[#1a1a1a] cursor-pointer shadow-md"
                  >
                    <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-xs font-black">
                      +{overflow}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="rounded-none border-2 border-black bg-white dark:border-white dark:bg-black px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-black dark:text-white" />
                  <span className="text-xs font-bold text-black dark:text-white">
                    {overflow} more collaborator{overflow !== 1 ? 's' : ''}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total count label */}
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 ml-1 hidden md:inline">
          {collaborators.length} {collaborators.length === 1 ? 'User' : 'Users'}
        </span>
      </div>
    </TooltipProvider>
  );
}
