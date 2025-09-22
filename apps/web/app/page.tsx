import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FaPhoenixSquadron } from "react-icons/fa";
export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#000000] text-[#FFFFFF]">
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#FFFFFF] to-[#e5e5e5] bg-clip-text text-transparent">
          Your All-in-One Collaborative Canvas-PageSmith
        </h1>
        <p className="mt-6 text-lg md:text-xl text-[#e5e5e5]">
          Inspired by Notion, built for productivity. Bring your ideas, code, and tasks together in one seamless, real-time workspace.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-[#fca311] text-[#14213d] hover:bg-[#fca311]/90">
            <Link href="/sign-up">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="border-[#fca311] text-[#FFFFFF] hover:bg-[#ffffff]">
            <Link href="/sign-in">
              Already have an account?
            </Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-8 flex items-center gap-4 text-sm text-[#e5e5e5]/80">
    
        <div className="h-6 w-6 rounded-full bg-[#14213d] flex items-center justify-center">
            <FaPhoenixSquadron/>
        </div>
        <span>Built with Next.js, Clerk, and Socket.IO.</span>
      </footer>
    </main>
  );
}

