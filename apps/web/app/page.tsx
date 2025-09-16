import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The main landing page of the application.
 * This is the first page new users will see. It serves as a marketing page
 * with a clear call-to-action to sign up or sign in.
 */
export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Your All-in-One Collaborative Canvas
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300">
          Inspired by Notion, built for productivity. Bring your ideas, code, and tasks together in one seamless, real-time workspace.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">
              Already have an account?
            </Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-8 text-sm text-gray-500">
        Built with Next.js, Clerk, and Socket.IO.
      </footer>
    </main>
  );
}
