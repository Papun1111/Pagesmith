import Link from 'next/link';
import { UserProfileButton } from './UserProfileButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { MobileSidebarContent } from './Sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black dark:border-white/20 bg-[#F0F0F0]/90 dark:bg-[#141414]/90 backdrop-blur-md transition-colors duration-300">
      <div className="flex h-20 items-center justify-between px-6">
        {/* Logo - visible only on mobile since desktop has sidebar */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-black transition-transform duration-200 group-hover:-rotate-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" className="text-black dark:text-white">
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M15 3v6h6" />
              </svg>
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase text-black dark:text-white">PageSmith</span>
          </Link>
        </div>

        {/* Desktop: just a spacer since the sidebar has the logo */}
        <div className="hidden md:block" />

        <div className="flex items-center gap-4">
          {/* User Profile Button */}
          <div className="hidden md:block border-2 border-black dark:border-white rounded-full p-0.5 bg-white dark:bg-black hover:scale-105 transition-transform">
            <UserProfileButton />
          </div>

          {/* Mobile Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-none border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                <Menu className="h-6 w-6 stroke-[3]" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>

            {/* Mobile Sidebar Sheet */}
            <SheetContent
              side="left"
              className="p-0 w-[280px] border-r-2 border-black dark:border-white/20 bg-[#F0F0F0] dark:bg-[#141414]"
            >
              <MobileSidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}