"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { Canvas } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const CanvasGrid = ({ canvases }: { canvases: Canvas[] }) => (
  <motion.div
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: { staggerChildren: 0.1 },
      },
      hidden: {},
    }}
  >
    {canvases.map((canvas) => (
      <Link
        href={`/canvas/${canvas._id}`}
        key={canvas._id}
        className="no-underline text-inherit"
        passHref
      >
        <motion.div
          className="border-2 border-black dark:border-white p-6 h-48 flex flex-col justify-between group cursor-pointer bg-white dark:bg-[#1a1a1a] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div>
            <h3 className="font-black text-lg sm:text-xl truncate flex items-start gap-2 uppercase tracking-tight">
              <FileText className="h-5 w-5 mt-1 flex-shrink-0" />
              <span className="truncate">{canvas.title}</span>
            </h3>
          </div>
          <div className="flex justify-between items-end border-t-2 border-black/10 dark:border-white/20 pt-4 group-hover:border-white/20 dark:group-hover:border-black/20">
            <p className="text-xs font-bold opacity-70 uppercase tracking-wider">
              Updated: {new Date(canvas.updatedAt).toLocaleDateString()}
            </p>
            <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      </Link>
    ))}
  </motion.div>
);

const DashboardSkeleton = () => (
  <div className="md:ml-16 pt-24 p-4 md:p-8 space-y-12 bg-[#F0F0F0] dark:bg-[#111111]">
    <div className="flex items-center justify-between">
      <Skeleton className="h-12 w-48 sm:w-64 bg-gray-300 dark:bg-neutral-800 rounded-none" />
      <Skeleton className="h-14 w-14 sm:w-48 bg-gray-300 dark:bg-neutral-800 rounded-none" />
    </div>
    <div className="space-y-12">
      <div>
        <Skeleton className="h-10 w-48 mb-6 bg-gray-300 dark:bg-neutral-800 rounded-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-none bg-gray-300 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-10 w-64 mb-6 bg-gray-300 dark:bg-neutral-800 rounded-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-none bg-gray-300 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const fetchCanvases = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getToken();
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
      router.push("/");
    }
  }, [getToken, isLoaded, isSignedIn, router]);

  const handleCreateNewCanvas = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");
      const newCanvas = await apiClient.createCanvas(
        { title: "Untitled Canvas" },
        token
      );
      setCanvases((prev) => [...prev, newCanvas]);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to create new canvas:", err);
        setError(err.message || "Could not create a new canvas.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const ownedCanvases = canvases.filter((c) => c.ownerId === userId);
  const sharedCanvases = canvases.filter((c) => c.ownerId !== userId);

  if (!isLoaded || isLoading) {
    return (
      <main
        style={{ fontFamily: "'Poppins', sans-serif" }}
        className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen dark:bg-[#111111] dark:text-white"
      >
        <div className="fixed top-0 left-0 z-40 h-full w-16 hidden md:flex items-center justify-center border-r-2 border-black dark:border-white bg-[#F0F0F0] dark:bg-[#111111]">
          <span className="font-black text-xl [writing-mode:vertical-rl] tracking-widest uppercase text-black dark:text-white whitespace-nowrap">
            DASHBOARD • WORKSPACE
          </span>
        </div>
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <main
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen dark:bg-[#111111] dark:text-white transition-colors duration-300"
    >
      <div className="md:ml-16 pt-24 p-6 md:p-12 space-y-16">
        {error && (
          <div className="flex items-center gap-4 border-2 border-red-600 bg-red-100 p-6 text-red-700 font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
            <AlertTriangle className="h-8 w-8" />
            <p>{error}</p>
          </div>
        )}

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
              <div className="bg-black dark:bg-white text-white dark:text-black p-2">
                 <FileText className="h-8 w-8" />
              </div>
              My Canvases
            </h2>
            <Button
              onClick={handleCreateNewCanvas}
              disabled={isCreating}
              className="bg-black text-white rounded-none hover:bg-white hover:text-black border-2 border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:border-white px-8 py-6 font-black uppercase tracking-wide text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all"
            >
              <PlusCircle className="h-6 w-6 mr-2" />
              {isCreating ? "Creating..." : "New Canvas"}
            </Button>
          </div>
          
          {ownedCanvases.length > 0 ? (
            <CanvasGrid canvases={ownedCanvases} />
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-black dark:border-white bg-white/50 dark:bg-white/5">
              <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-2">NO CANVASES... YET.</h3>
              <p className="text-black/60 dark:text-white/60 font-medium">
                Click &quot;New Canvas&quot; to start your next big idea.
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2">
                 <Users className="h-8 w-8" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
              Shared With Me
            </h2>
          </div>
          
          {sharedCanvases.length > 0 ? (
            <CanvasGrid canvases={sharedCanvases} />
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-black dark:border-white bg-white/50 dark:bg-white/5">
              <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-2">NOTHING TO SEE HERE.</h3>
              <p className="text-black/60 dark:text-white/60 font-medium">
                When someone shares a canvas with you, it will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}