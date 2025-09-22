'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Canvas } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, FileText, AlertTriangle, Users } from 'lucide-react';

// A reusable component to render a grid of canvas cards.
const CanvasGrid = ({ canvases }: { canvases: Canvas[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {canvases.map((canvas) => (
      <Link href={`/canvas/${canvas._id}`} key={canvas._id}>
        <Card className="hover:shadow-md transition-shadow hover:border-primary h-full">
          <CardHeader>
            <CardTitle className="truncate flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{canvas.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Last updated: {new Date(canvas.updatedAt).toLocaleDateString()}
            </CardDescription>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  // FIX: Destructure isLoaded and isSignedIn to manage the auth state.
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Only attempt to fetch data if Clerk has loaded and the user is signed in.
    if (isLoaded && isSignedIn) {
      const fetchCanvases = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getToken();
          // This check is now safer because we know a session should exist.
          if (!token) throw new Error("Authentication session not found.");
          const userCanvases = await apiClient.getCanvases(token);
          setCanvases(userCanvases);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error("Failed to fetch canvases:", err);
            setError(err.message || "Failed to load your canvases.");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchCanvases();
    } else if (isLoaded && !isSignedIn) {
      // If Clerk is loaded but the user is not signed in, handle it gracefully.
      // For example, redirect to the landing page.
      router.push('/');
    }
    // FIX: Add isLoaded and isSignedIn to the dependency array to trigger the effect
    // when the authentication state changes.
  }, [getToken, isLoaded, isSignedIn, router]);

  const handleCreateNewCanvas = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");
      const newCanvas = await apiClient.createCanvas({ title: 'Untitled Canvas' }, token);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to create new canvas:", err);
        setError(err.message || "Could not create a new canvas.");
        setIsCreating(false);
      }
    }
  };

  // Filter canvases into owned and shared lists.
  const ownedCanvases = canvases.filter(c => c.ownerId === userId);
  const sharedCanvases = canvases.filter(c => c.ownerId !== userId);

  // Show a comprehensive loading state until Clerk has initialized.
  if (!isLoaded || isLoading) {
     return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
                    </div>
                </div>
            </div>
        </div>
     );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleCreateNewCanvas} disabled={isCreating}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'Create New Canvas'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* My Canvases Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6" /> My Canvases
          </h2>
          {ownedCanvases.length > 0 ? (
            <CanvasGrid canvases={ownedCanvases} />
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold">You haven&apos;t created any canvases yet.</h3>
              <p className="text-muted-foreground mt-1">Click the Create New Canvas button to get started.</p>
            </div>
          )}
        </div>

        {/* Shared With Me Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" /> Shared With Me
          </h2>
          {sharedCanvases.length > 0 ? (
            <CanvasGrid canvases={sharedCanvases} />
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold">No canvases have been shared with you.</h3>
              <p className="text-muted-foreground mt-1">When someone shares a canvas, it will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

