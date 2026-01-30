'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PricingCard } from '@/components/features/billing/PricingCard';
import { apiClient } from '@/lib/api';
import type { PricingTier, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// --- Pricing Data ---
const pricingTiers: Omit<PricingTier, 'isCurrentPlan'>[] = [
  {
    id: 'free',
    name: 'Free',
    priceId: undefined, // Free plan has no price ID
    priceMonthly: 0,
    description: 'For individuals starting out. Get a feel for our platform.',
    features: ['2 Canvases', '1 Collaborator per Canvas', 'Basic AI Assistant (5 queries/day)'],
  },
  {
    id: 'demon',
    name: 'Demon',
    priceId: process.env.NEXT_PUBLIC_STRIPE_DEMON_PRICE_ID || 'price_demon_placeholder',
    priceMonthly: 10,
    description: 'For power users and small teams who need more.',
    features: [
      'Unlimited Canvases',
      '5 Collaborators per Canvas',
      'Advanced AI Assistant (100 queries/day)',
      'Version History',
    ],
    isMostPopular: true,
  },
  {
    id: 'hashira',
    name: 'Hashira',
    priceId: process.env.NEXT_PUBLIC_STRIPE_HASHIRA_PRICE_ID || 'price_hashira_placeholder',
    priceMonthly: 25,
    description: 'For large teams and organizations requiring advanced features.',
    features: [
      'All Demon Features',
      'Unlimited Collaborators',
      'Full AI Access',
      'Team Dashboard & Analytics',
      'Priority Support',
    ],
  },
];

export default function PricingPage() {
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the user's profile to determine their current subscription plan.
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await getToken();
        if (token) {
          const profile = await apiClient.getUserProfile(token);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [getToken]);

  const currentPlan = userProfile?.plan || 'free';

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen p-6 md:p-12 dark:bg-[#111111] dark:text-white transition-colors duration-300">
        <div className="text-center mb-16 space-y-4">
           <Skeleton className="h-12 w-3/4 md:w-1/2 mx-auto bg-gray-300 dark:bg-neutral-800 rounded-none" />
           <Skeleton className="h-6 w-1/2 md:w-1/3 mx-auto bg-gray-300 dark:bg-neutral-800 rounded-none" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-[600px] w-full bg-gray-300 dark:bg-neutral-800 rounded-none" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen p-6 md:p-12 dark:bg-[#111111] dark:text-white transition-colors duration-300">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
          Choose Your Weapon
        </h1>
        <p className="text-lg md:text-xl font-bold opacity-70 max-w-2xl mx-auto uppercase tracking-wide">
          Unlock your potential with plans designed for speed and power. No hidden fees. Cancel anytime.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {pricingTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={{
              ...tier,
              isCurrentPlan: currentPlan === tier.id,
            }}
          />
        ))}
      </div>
    </div>
  );
}