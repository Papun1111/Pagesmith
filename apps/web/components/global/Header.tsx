import Link from 'next/link';
import { UserProfileButton } from './UserProfileButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';


export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {/* Replace with your actual logo */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
            </svg>
            <span className="font-bold">PageSmith</span>
          </Link>
         
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile Button */}
          <UserProfileButton  />
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              {/* Reuse the Sidebar component for the mobile menu */}
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
