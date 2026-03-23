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
import { motion, AnimatePresence } from "motion/react";
import { Clock10 } from "lucide-react";
import { Sparkle } from "lucide-react";
/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 24,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Color palette for canvas cards (deterministic by index)           */
/* ------------------------------------------------------------------ */

const CARD_ACCENTS = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700", icon: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-300 dark:border-sky-700", icon: "text-sky-600 dark:text-sky-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-700", icon: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-700", icon: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-300 dark:border-rose-700", icon: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-300 dark:border-orange-700", icon: "text-orange-600 dark:text-orange-400" },
];

/* ------------------------------------------------------------------ */
/*  Relative time formatter                                           */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  CanvasCard                                                         */
/* ------------------------------------------------------------------ */

function CanvasCard({ canvas, index }: { canvas: Canvas; index: number }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]!;
  const collabCount = canvas.collaborators?.length ?? 0;

  return (
    <Link
      href={`/canvas/${canvas._id}`}
      className="no-underline text-inherit block"
    >
      <motion.div
        variants={cardVariants}
        whileHover={{
          y: -4,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative group cursor-pointer overflow-hidden
          border-2 border-black dark:border-white/80
          bg-white dark:bg-[#1a1a1a]
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]
          hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)]
          transition-shadow duration-200
        `}
      >
        {/* Top accent stripe */}
        <div className={`h-1.5 w-full ${accent.bg} ${accent.border} border-b`} />

        {/* Card body */}
        <div className="p-5 flex flex-col h-52">
          {/* Header */}
          <div className="flex items-start justify-between mb-auto">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 border-2 border-black dark:border-white/60 ${accent.bg} flex-shrink-0`}>
                <FileText className={`h-4 w-4 ${accent.icon}`} />
              </div>
              <h3 className="font-black text-base sm:text-lg uppercase tracking-tight leading-tight truncate pt-1 text-black dark:text-white">
                {canvas.title}
              </h3>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 ml-2"
            >
              <ArrowUpRight className="h-5 w-5 text-black dark:text-white" />
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end pt-4 border-t-2 border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5 text-black/50 dark:text-white/50">
              <Clock10 className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {timeAgo(canvas.updatedAt)}
              </span>
            </div>

            {/* Collaborators indicator */}
            {collabCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {canvas.collaborators.slice(0, 3).map((c, i) => (
                    <div
                      key={c.userId}
                      className={`
                        h-6 w-6 rounded-full border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center
                        text-[9px] font-black uppercase
                        ${i === 0 ? "bg-violet-500 text-white" : ""}
                        ${i === 1 ? "bg-sky-500 text-white" : ""}
                        ${i === 2 ? "bg-amber-500 text-white" : ""}
                      `}
                    >
                      {c.userId.substring(5, 7)}
                    </div>
                  ))}
                </div>
                {collabCount > 3 && (
                  <span className="text-[10px] font-black text-black/40 dark:text-white/40">
                    +{collabCount - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
      </motion.div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  CanvasGrid                                                         */
/* ------------------------------------------------------------------ */

function CanvasGrid({ canvases }: { canvases: Canvas[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {canvases.map((canvas, index) => (
        <CanvasCard key={canvas._id} canvas={canvas} index={index} />
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats summary bar                                                  */
/* ------------------------------------------------------------------ */

function StatsBar({ owned, shared }: { owned: number; shared: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-4 md:gap-6"
    >
      {[
        { label: "Total Canvases", value: owned + shared, icon: FileText },
        { label: "Owned", value: owned, icon: Sparkle },
        { label: "Shared", value: shared, icon: Users },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 border-2 border-black dark:border-white/60 bg-white dark:bg-[#1a1a1a] px-5 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.6)]"
        >
          <stat.icon className="h-4 w-4 text-black/50 dark:text-white/50" />
          <div>
            <p className="text-2xl font-black text-black dark:text-white leading-none">
              {stat.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 dark:text-white/40">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Skeleton                                                 */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-10">
      {/* Stats skeleton */}
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-40 bg-gray-300 dark:bg-neutral-800 rounded-none" />
        ))}
      </div>
      {/* Section header skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-gray-300 dark:bg-neutral-800 rounded-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-none bg-gray-300 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 bg-gray-300 dark:bg-neutral-800 rounded-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-none bg-gray-300 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="text-center py-20 border-2 border-dashed border-black/30 dark:border-white/30 bg-white/30 dark:bg-white/[0.03]"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block mb-4"
      >
        <div className="p-4 border-2 border-black/20 dark:border-white/20 bg-white dark:bg-[#1a1a1a] mx-auto inline-block">
          <Icon className="h-8 w-8 text-black/30 dark:text-white/30" />
        </div>
      </motion.div>
      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-black/50 dark:text-white/50 font-medium max-w-md mx-auto">
        {subtitle}
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
    >
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3 text-black dark:text-white">
        <div className="bg-black dark:bg-white text-white dark:text-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
          <Icon className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        {title}
      </h2>
      {action}
    </motion.div>
  );
}

/* ================================================================== */
/*  DashboardPage                                                      */
/* ================================================================== */

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
      <main className="w-full min-h-screen bg-[#F0F0F0] dark:bg-[#111111] text-black dark:text-white">
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#F0F0F0] dark:bg-[#111111] text-black dark:text-white transition-colors duration-300">
      <div className="p-6 md:p-10 space-y-12">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-4 border-2 border-red-600 bg-red-50 dark:bg-red-950/30 p-5 text-red-700 dark:text-red-400 font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
            >
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <StatsBar owned={ownedCanvases.length} shared={sharedCanvases.length} />

        {/* My Canvases */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible">
          <SectionHeader
            icon={FileText}
            title="My Canvases"
            action={
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleCreateNewCanvas}
                  disabled={isCreating}
                  className="bg-black text-white rounded-none hover:bg-white hover:text-black border-2 border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:border-white px-6 py-5 font-black uppercase tracking-wide text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all duration-200"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  {isCreating ? "Creating..." : "New Canvas"}
                </Button>
              </motion.div>
            }
          />

          {ownedCanvases.length > 0 ? (
            <CanvasGrid canvases={ownedCanvases} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No Canvases Yet"
              subtitle='Click "New Canvas" to start your next big idea.'
            />
          )}
        </motion.section>

        {/* Shared With Me */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible">
          <SectionHeader icon={Users} title="Shared With Me" />

          {sharedCanvases.length > 0 ? (
            <CanvasGrid canvases={sharedCanvases} />
          ) : (
            <EmptyState
              icon={Users}
              title="Nothing Shared Yet"
              subtitle="When someone shares a canvas with you, it will appear here."
            />
          )}
        </motion.section>
      </div>
    </main>
  );
}