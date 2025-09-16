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
import { PlusCircle, FileText, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all of the user's canvases on component mount.
  useEffect(() => {
    const fetchCanvases = async () => {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token not found.");
        const userCanvases = await apiClient.getCanvases(token);
        setCanvases(userCanvases);
      } catch (err: any) {
        console.error("Failed to fetch canvases:", err);
        setError(err.message || "Failed to load your canvases. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvases();
  }, [getToken]);

  // Handles the creation of a new canvas.
  const handleCreateNewCanvas = async () => {
    setIsCreating(true);
    setError(null); // Reset error on new action
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");
      const newCanvas = await apiClient.createCanvas({ title: 'Untitled Canvas' }, token);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (err: any) {
      console.error("Failed to create new canvas:", err);
      setError(err.message || "Could not create a new canvas. Please try again.");
      setIsCreating(false); // Ensure loading state is turned off on error
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Canvases</h1>
        <Button onClick={handleCreateNewCanvas} disabled={isCreating}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'Create New Canvas'}
        </Button>
      </div>

      {/* Display a prominent error message if something goes wrong */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        // Loading State Skeletons
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : canvases.length > 0 ? (
        // Display Canvases
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {canvases.map((canvas) => (
            <Link href={`/canvas/${canvas._id}`} key={canvas._id}>
              <Card className="hover:shadow-md transition-shadow hover:border-primary">
                <CardHeader>
                  <CardTitle className="truncate flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    {canvas.title}
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
      ) : (
        // Empty State (only show if not loading and no error)
        !error && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Canvases Yet</h2>
            <p className="text-muted-foreground mt-2">
              Click the "Create New Canvas" button to get started.
            </p>
          </div>
        )
      )}
    </div>
  );
}
