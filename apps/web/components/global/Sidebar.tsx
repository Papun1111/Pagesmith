'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, FileText  } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { type Canvas } from '@/types';
import { cn } from '@/lib/utils';
import { FaPhoenixFramework } from "react-icons/fa"
// Reusable component for a list of canvas links
const CanvasLinkList = ({ canvases }: { canvases: Canvas[] }) => {
  const pathname = usePathname();
  return (
    <div className="space-y-1">
      {canvases.map((canvas) => (
        <Link
          href={`/canvas/${canvas._id}`}
          key={canvas._id}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
            pathname === `/canvas/${canvas._id}`
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{canvas.title}</span>
        </Link>
      ))}
    </div>
  );
};


export function Sidebar() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchCanvases = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const userCanvases = await apiClient.getCanvases(token);
        setCanvases(userCanvases);
      } catch (error) {
        console.error("Failed to fetch canvases for sidebar:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvases();
  }, [getToken]);

  const handleCreateNewCanvas = async () => {
    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");
      const newCanvas = await apiClient.createCanvas({ title: 'Untitled Canvas' }, token);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (error) {
      console.error("Failed to create new canvas from sidebar:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const ownedCanvases = canvases.filter(c => c.ownerId === userId);
  const sharedCanvases = canvases.filter(c => c.ownerId !== userId);

  return (
    <aside className="h-full w-64 flex-col border-r bg-gray-100/40 p-4 dark:bg-gray-800/40 hidden md:flex">
      <div className="flex items-center gap-2 mb-6">
        <FaPhoenixFramework></FaPhoenixFramework>
        <h2 className="text-lg font-semibold">Project Phoenix</h2>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto">
        <Button onClick={handleCreateNewCanvas} disabled={isCreating} className="w-full justify-start">
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'New Canvas'}
        </Button>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {ownedCanvases.length > 0 && (
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">My Canvases</h3>
                <CanvasLinkList canvases={ownedCanvases} />
              </div>
            )}
            {sharedCanvases.length > 0 && (
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Shared With Me</h3>
                <CanvasLinkList canvases={sharedCanvases} />
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}

