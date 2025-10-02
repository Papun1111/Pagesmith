'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs'; // Mocked below
import { useRouter } from 'next/navigation'; // Mocked below
import Link from 'next/link'; // Replaced with <a>
import { apiClient } from '@/lib/api'; // Mocked below
import type { Canvas } from '@/types'; // Mocked below
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, FileText, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';



// NOTE: To use the 'Poppins' font, please add the following to your HTML head:
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet">


// --- MOCKS to replace server/framework dependencies ---

// --- COMPONENTS ---

const CanvasGrid = ({ canvases }: { canvases: Canvas[] }) => (
    <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
            visible: {
                transition: { staggerChildren: 0.1 },
            },
            hidden: {}
        }}
    >
        {canvases.map((canvas) => (
            <a href={`/canvas/${canvas._id}`} key={canvas._id} className="no-underline text-inherit">
                <motion.div
                    className="border border-black p-4 h-48 flex flex-col justify-between group cursor-pointer hover:bg-black hover:text-white transition-colors"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                    }}
                >
                    <div>
                        <h3 className="font-black text-xl truncate flex items-start gap-2">
                            <FileText className="h-5 w-5 mt-1 flex-shrink-0" />
                            <span className="truncate">{canvas.title}</span>
                        </h3>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-sm opacity-70">
                            Updated: {new Date(canvas.updatedAt).toLocaleDateString()}
                        </p>
                        <ArrowUpRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </motion.div>
            </a>
        ))}
    </motion.div>
);

const DashboardSkeleton = () => (
    <div className="md:ml-16 pt-28 p-4 md:p-8 space-y-12">
        <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 bg-gray-300" />
            <Skeleton className="h-12 w-48 bg-gray-300" />
        </div>
        <div className="space-y-12">
            <div>
                <Skeleton className="h-8 w-48 mb-4 bg-gray-300" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-none bg-gray-300" />)}
                </div>
            </div>
            <div>
                <Skeleton className="h-8 w-64 mb-4 bg-gray-300" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-none bg-gray-300" />)}
                </div>
            </div>
        </div>
    </div>
)


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
            router.push('/');
        }
    }, [getToken, isLoaded, isSignedIn, router]);

    const handleCreateNewCanvas = async () => {
        setIsCreating(true);
        setError(null);
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication failed.");
            const newCanvas = await apiClient.createCanvas({ title: 'Untitled Canvas' }, token);
            // In a real app, this would also update the local state or refetch
            setCanvases(prev => [...prev, newCanvas]);
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

    const ownedCanvases = canvases.filter(c => c.ownerId === userId);
    const sharedCanvases = canvases.filter(c => c.ownerId !== userId);

    if (!isLoaded || isLoading) {
        return (
             <main style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen">
                <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 px-8 bg-[#F0F0F0]/80 backdrop-blur-sm border-b border-black">
                     <Link href="/" className="text-2xl font-black cursor-pointer">PageSmith</Link>
                     <Skeleton className="h-12 w-48 bg-gray-300"/>
                </header>
                 <div className="fixed top-0 left-0 z-40 h-full hidden md:flex items-center justify-center border-r border-black bg-[#F0F0F0]">
                    <span className="font-black text-xl [writing-mode:vertical-rl] tracking-widest uppercase">
                        Dashboard
                    </span>
                </div>
                <DashboardSkeleton />
             </main>
        )
    }

    return (
        <main style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen">
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 px-8 bg-[#F0F0F0]/80 backdrop-blur-sm border-b border-black">
                <Link href="/" className="text-2xl font-black cursor-pointer">PageSmith</Link>
                <Button onClick={handleCreateNewCanvas} disabled={isCreating} className="bg-black text-white rounded-none hover:bg-black/80 px-6 py-6 font-bold">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {isCreating ? 'Creating...' : 'Create Canvas'}
                </Button>
            </header>

            <div className="fixed top-0 left-0 z-40 h-full hidden md:flex items-center justify-center border-r border-black bg-[#F0F0F0]">
                <span className="font-black text-xl [writing-mode:vertical-rl] tracking-widest uppercase">
                    Dashboard
                </span>
            </div>

            <div className="md:ml-16 pt-28 p-4 md:p-8 space-y-12">
                {error && (
                    <div className="flex items-center gap-4 border border-red-500 bg-red-100 p-4 text-red-700 font-bold">
                        <AlertTriangle className="h-6 w-6" />
                        <p>{error}</p>
                    </div>
                )}

                <section>
                    <h2 className="text-4xl font-black mb-4 flex items-center gap-3">
                        My Canvases
                    </h2>
                    {ownedCanvases.length > 0 ? (
                        <CanvasGrid canvases={ownedCanvases} />
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-black">
                            <h3 className="text-2xl font-black">NO CANVASES... YET.</h3>
                            <p className="text-black/70 mt-2">Click &quot;Create Canvas&quot; to start a new project.</p>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-4xl font-black mb-4 flex items-center gap-3">
                         Shared With Me
                    </h2>
                    {sharedCanvases.length > 0 ? (
                        <CanvasGrid canvases={sharedCanvases} />
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-black">
                            <h3 className="text-2xl font-black">NOTHING TO SEE HERE.</h3>
                            <p className="text-black/70 mt-2">When someone shares a canvas, it will appear here.</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

