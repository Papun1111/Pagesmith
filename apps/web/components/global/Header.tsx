import Link from 'next/link';
import { UserProfileButton } from './UserProfileButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function Header() {
  return (
    // --- STYLE CHANGE ---
    // Updated dark mode background to #1a1a1a and adjusted border color.
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-neutral-800">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-black dark:text-white">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
            </svg>
            {/* --- STYLE CHANGE --- */}
            <span className="font-bold text-black dark:text-white">PageSmith</span>
          </Link>
          
          {/* --- STYLE CHANGE --- */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground dark:text-gray-400 dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-foreground dark:text-gray-400 dark:hover:text-white">
              Pricing
            </Link>
              <Link href="/settings/billing" className="text-muted-foreground transition-colors hover:text-foreground dark:text-gray-400 dark:hover:text-white">
              Upgrade Plans
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <UserProfileButton />
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            {/* --- STYLE CHANGE --- */}
            <SheetContent className="bg-white dark:bg-[#1a1a1a] dark:border-neutral-800">
              {/* Mobile navigation content goes here */}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}