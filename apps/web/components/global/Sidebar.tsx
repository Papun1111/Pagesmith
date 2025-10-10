'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, FileText, Menu, X } from 'lucide-react'; // Added Menu and X icons
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { type Canvas } from '@/types';
import { cn } from '@/lib/utils';
import { FaPhoenixFramework } from "react-icons/fa";

// This component remains unchanged
const CanvasLinkList = ({ canvases }: { canvases: Canvas[] }) => {
    const pathname = usePathname();
    return (
        <div className="space-y-1">
            {canvases.map((canvas) => (
                <Link
                    href={`/canvas/${canvas._id}`}
                    key={canvas._id}
                    className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        pathname === `/canvas/${canvas._id}`
                            ? "bg-black text-white"
                            : "text-black/70 hover:bg-black/10"
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

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
            setIsMobileMenuOpen(false); // Close mobile menu on navigation
        } catch (error) {
            console.error("Failed to create new canvas from sidebar:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const ownedCanvases = canvases.filter(c => c.ownerId === userId);
    const sharedCanvases = canvases.filter(c => c.ownerId !== userId);

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <FaPhoenixFramework className="h-6 w-6" />
                    <h2 className="text-lg font-black">PageSmith</h2>
                </div>
                {/* Mobile-only close button */}
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-6 w-6" />
                </Button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto">
                <Button onClick={handleCreateNewCanvas} disabled={isCreating} className="w-full justify-start bg-transparent text-black border-2 border-black rounded-none hover:bg-black hover:text-white font-bold">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isCreating ? 'Creating...' : 'New Canvas'}
                </Button>

                {isLoading ? (
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-8 w-full bg-gray-300" />
                        <Skeleton className="h-8 w-full bg-gray-300" />
                        <Skeleton className="h-8 w-full bg-gray-300" />
                    </div>
                ) : (
                    <div className="space-y-6 pt-4">
                        {ownedCanvases.length > 0 && (
                            <div>
                                <h3 className="mb-2 px-2 text-sm font-bold uppercase text-black/50">My Canvases</h3>
                                <CanvasLinkList canvases={ownedCanvases} />
                            </div>
                        )}
                        {sharedCanvases.length > 0 && (
                            <div>
                                <h3 className="mb-2 px-2 text-sm font-bold uppercase text-black/50">Shared With Me</h3>
                                <CanvasLinkList canvases={sharedCanvases} />
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </>
    );

    return (
        <>
            {/* Hamburger Menu Button (Mobile Only) */}
            <div className="sticky top-0 bg-[#F0F0F0] p-2 md:hidden border-b border-black">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>


            {/* Overlay (Mobile Only) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Sidebar Container */}
            <aside
                className={cn(
                    // Base styles
                    "h-screen w-64 flex-col border-r border-black bg-[#F0F0F0] p-4 flex transition-transform duration-300 ease-in-out",
                    // Mobile styles
                    "fixed top-0 left-0 z-50",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop styles
                    "md:sticky md:translate-x-0"
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}