'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  PlusCircle,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  CreditCard,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api';
import { type Canvas } from '@/types';
import { cn } from '@/lib/utils';
import { FaPhoenixFramework } from 'react-icons/fa';
import { UserProfileButton } from './UserProfileButton';

/* ------------------------------------------------------------------ */
/*  Navigation configuration                                          */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pricing', label: 'Pricing', icon: Sparkles },
  { href: '/settings/billing', label: 'Settings', icon: Settings },
] as const;

/* ------------------------------------------------------------------ */
/*  NavLink                                                            */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const inner = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200',
        isActive
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
          : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white',
        isCollapsed && 'justify-center px-0'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="rounded-none border-2 border-black bg-white font-bold uppercase tracking-wider text-black dark:border-white dark:bg-black dark:text-white"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

/* ------------------------------------------------------------------ */
/*  CanvasLinkList                                                     */
/* ------------------------------------------------------------------ */

function CanvasLinkList({
  canvases,
  isCollapsed,
}: {
  canvases: Canvas[];
  isCollapsed: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-0.5">
      {canvases.map((canvas) => {
        const isActive = pathname === `/canvas/${canvas._id}`;
        const inner = (
          <Link
            href={`/canvas/${canvas._id}`}
            key={canvas._id}
            className={cn(
              'flex items-center gap-2.5 rounded-none px-3 py-2 text-sm transition-all duration-200',
              isActive
                ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate">{canvas.title}</span>
            )}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={canvas._id} delayDuration={0}>
              <TooltipTrigger asChild>{inner}</TooltipTrigger>
              <TooltipContent
                side="right"
                className="rounded-none border-2 border-black bg-white font-bold text-black dark:border-white dark:bg-black dark:text-white"
              >
                {canvas.title}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={canvas._id}>{inner}</div>;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionHeader                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({
  label,
  isCollapsed,
}: {
  label: string;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <div className="mx-auto my-2 h-px w-6 bg-black/20 dark:bg-white/20" />
    );
  }

  return (
    <h3 className="mb-1 mt-3 px-3 text-[11px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40">
      {label}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

const SIDEBAR_WIDTH_EXPANDED = 256; // 16rem / w-64
const SIDEBAR_WIDTH_COLLAPSED = 64;  // 4rem / w-16

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, userId } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  /* ---- Fetch canvases ---- */
  useEffect(() => {
    const fetchCanvases = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const userCanvases = await apiClient.getCanvases(token);
        setCanvases(userCanvases);
      } catch (error) {
        console.error('Failed to fetch canvases for sidebar:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvases();
  }, [getToken]);

  /* ---- Create canvas ---- */
  const handleCreateNewCanvas = async () => {
    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication failed.');
      const newCanvas = await apiClient.createCanvas(
        { title: 'Untitled Canvas' },
        token
      );
      setCanvases((prev) => [...prev, newCanvas]);
      router.push(`/canvas/${newCanvas._id}`);
    } catch (error) {
      console.error('Failed to create new canvas from sidebar:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const ownedCanvases = canvases.filter((c) => c.ownerId === userId);
  const sharedCanvases = canvases.filter((c) => c.ownerId !== userId);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'sidebar-transition hidden md:flex flex-col h-screen border-r-2 border-black bg-[#F0F0F0] dark:border-white/20 dark:bg-[#141414] sticky top-0 left-0 z-40 select-none'
        )}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          minWidth: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
      >
        {/* ---- Logo ---- */}
        <div
          className={cn(
            'flex items-center border-b-2 border-black dark:border-white/20 h-20 px-4 flex-shrink-0',
            isCollapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <div className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex-shrink-0">
            <FaPhoenixFramework className="h-5 w-5 text-black dark:text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-black text-lg tracking-tighter uppercase text-black dark:text-white truncate">
              PageSmith
            </span>
          )}
        </div>

        {/* ---- New Canvas Button ---- */}
        <div className="px-3 pt-4 pb-2 flex-shrink-0">
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCreateNewCanvas}
                  disabled={isCreating}
                  className="w-full h-10 p-0 bg-black text-white border-2 border-black rounded-none hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="rounded-none border-2 border-black bg-white font-bold uppercase tracking-wider text-black dark:border-white dark:bg-black dark:text-white"
              >
                New Canvas
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleCreateNewCanvas}
              disabled={isCreating}
              className="w-full justify-start bg-black text-white border-2 border-black rounded-none hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'New Canvas'}
            </Button>
          )}
        </div>

        {/* ---- Navigation Links ---- */}
        <nav className="px-3 space-y-0.5 flex-shrink-0">
          <SectionHeader label="Navigation" isCollapsed={isCollapsed} />
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname.startsWith(item.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* ---- Canvas List ---- */}
        <ScrollArea className="flex-1 px-3 mt-2">
          {isLoading ? (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-8 w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
              <Skeleton className="h-8 w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
              <Skeleton className="h-8 w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
            </div>
          ) : (
            <>
              {ownedCanvases.length > 0 && (
                <div>
                  <SectionHeader label="My Canvases" isCollapsed={isCollapsed} />
                  <CanvasLinkList canvases={ownedCanvases} isCollapsed={isCollapsed} />
                </div>
              )}
              {sharedCanvases.length > 0 && (
                <div>
                  <SectionHeader label="Shared With Me" isCollapsed={isCollapsed} />
                  <CanvasLinkList canvases={sharedCanvases} isCollapsed={isCollapsed} />
                </div>
              )}
            </>
          )}
        </ScrollArea>

        {/* ---- Footer: User Profile + Toggle ---- */}
        <div className="flex-shrink-0 border-t-2 border-black dark:border-white/20 p-3">
          {/* User Profile */}
          <div
            className={cn(
              'flex items-center mb-3',
              isCollapsed ? 'justify-center' : 'gap-3 px-1'
            )}
          >
            <div className="border-2 border-black dark:border-white rounded-full p-0.5 bg-white dark:bg-black flex-shrink-0">
              <UserProfileButton />
            </div>
          </div>

          {/* Toggle Button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  'w-full rounded-none border-2 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200',
                  isCollapsed ? 'justify-center px-0' : 'justify-start'
                )}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="h-5 w-5 flex-shrink-0 mr-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Collapse
                    </span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="rounded-none border-2 border-black bg-white font-bold uppercase tracking-wider text-black dark:border-white dark:bg-black dark:text-white"
              >
                Expand Sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileSidebarContent — used by Header's Sheet                     */
/* ------------------------------------------------------------------ */

export function MobileSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
        console.error('Failed to fetch canvases for sidebar:', error);
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
      if (!token) throw new Error('Authentication failed.');
      const newCanvas = await apiClient.createCanvas(
        { title: 'Untitled Canvas' },
        token
      );
      router.push(`/canvas/${newCanvas._id}`);
      onNavigate?.();
    } catch (error) {
      console.error('Failed to create new canvas from sidebar:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const ownedCanvases = canvases.filter((c) => c.ownerId === userId);
  const sharedCanvases = canvases.filter((c) => c.ownerId !== userId);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b-2 border-black dark:border-white/20 h-20 px-5 flex-shrink-0">
        <div className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <FaPhoenixFramework className="h-5 w-5 text-black dark:text-white" />
        </div>
        <span className="font-black text-lg tracking-tighter uppercase text-black dark:text-white">
          PageSmith
        </span>
      </div>

      {/* New Canvas */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <Button
          onClick={handleCreateNewCanvas}
          disabled={isCreating}
          className="w-full justify-start bg-black text-white border-2 border-black rounded-none hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {isCreating ? 'Creating...' : 'New Canvas'}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-0.5 flex-shrink-0">
        <h3 className="mb-1 mt-3 px-3 text-[11px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40">
          Navigation
        </h3>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200',
              pathname.startsWith(item.href)
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
                : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Canvas List */}
      <ScrollArea className="flex-1 px-4 mt-2">
        {isLoading ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-8 w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
            <Skeleton className="h-8 w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
          </div>
        ) : (
          <>
            {ownedCanvases.length > 0 && (
              <div>
                <h3 className="mb-1 mt-3 px-3 text-[11px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40">
                  My Canvases
                </h3>
                <div className="space-y-0.5">
                  {ownedCanvases.map((canvas) => (
                    <Link
                      key={canvas._id}
                      href={`/canvas/${canvas._id}`}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-none px-3 py-2 text-sm transition-all duration-200',
                        pathname === `/canvas/${canvas._id}`
                          ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                          : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                      )}
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{canvas.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {sharedCanvases.length > 0 && (
              <div>
                <h3 className="mb-1 mt-3 px-3 text-[11px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40">
                  Shared With Me
                </h3>
                <div className="space-y-0.5">
                  {sharedCanvases.map((canvas) => (
                    <Link
                      key={canvas._id}
                      href={`/canvas/${canvas._id}`}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-none px-3 py-2 text-sm transition-all duration-200',
                        pathname === `/canvas/${canvas._id}`
                          ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                          : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                      )}
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{canvas.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 border-t-2 border-black dark:border-white/20 p-4">
        <div className="flex items-center gap-3 px-1">
          <div className="border-2 border-black dark:border-white rounded-full p-0.5 bg-white dark:bg-black flex-shrink-0">
            <UserProfileButton />
          </div>
        </div>
      </div>
    </div>
  );
}
