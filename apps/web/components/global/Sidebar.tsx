'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutDashboard, FileText, Settings } from 'lucide-react';

// Mock data for user's canvases. In a real app, this would be fetched from your API.
const userCanvases = [
  { id: '1', title: 'Project Phoenix Plan' },
  { id: '2', title: 'Q3 Marketing Strategy' },
  { id: '3', title: 'Component Library Ideas' },
];

/**
 * The sidebar component for navigation and listing the user's canvases.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* You can add your logo here as well */}
          <span className="">Dashboard</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              { 'bg-muted text-primary': pathname === '/' }
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/settings/billing"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              { 'bg-muted text-primary': pathname.startsWith('/settings') }
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
        <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                My Canvases
            </h2>
            <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Canvas
                </Button>
                {userCanvases.map((canvas) => (
                     <Link key={canvas.id} href={`/canvas/${canvas.id}`}>
                        <Button variant={pathname === `/canvas/${canvas.id}` ? 'secondary' : 'ghost'} className="w-full justify-start">
                           <FileText className="mr-2 h-4 w-4" />
                           {canvas.title}
                        </Button>
                     </Link>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
