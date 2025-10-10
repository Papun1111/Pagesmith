import Link from 'next/link';
import { UserProfileButton } from './UserProfileButton';
// Sheet components are no longer needed in the header
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { Menu } from 'lucide-react';

// The Sidebar import is kept if other logic depends on it, but it's not rendered here.
// For the mobile menu to appear, <Sidebar /> should be placed in your main layout file.
import { Sidebar } from './Sidebar';


export function Header() {
  return (
    // Added border-black for theme consistency
    <header className="sticky top-0 z-40 w-full border-b border-black bg-[#F0F0F0]">
      {/* Added responsive padding */}
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Added responsive gap */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            {/* Replace with your actual logo */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
            </svg>
            <span className="font-bold">PageSmith</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {/* Updated text colors for theme consistency */}
            <Link href="/dashboard" className="text-black/70 transition-colors hover:text-black">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-black/70 transition-colors hover:text-black">
              Pricing
            </Link>
             <Link href="/settings/billing" className="text-black/70 transition-colors hover:text-black">
              Upgrade Plans
            </Link>
          </nav>
        </div>

        {/* The gap here is also responsive */}
        <div className="flex items-center gap-2 sm:gap-4">
          <UserProfileButton />
          
          {/* The Sheet component has been removed from the header.
            The Sidebar component you provided earlier already contains its own logic 
            to show a hamburger menu on mobile and slide out. To see it,
            you should render the <Sidebar /> component once in your main app layout,
            typically alongside your main content area.
          */}
        </div>
      </div>
    </header>
  );
}