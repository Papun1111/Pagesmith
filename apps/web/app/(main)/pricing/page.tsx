'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PricingCard } from '@/components/features/billing/PricingCard';
import { apiClient } from '@/lib/api';
import type { PricingTier, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const pricingTiers: Omit<PricingTier, 'isCurrentPlan'>[] = [
  {
    id: 'free',
    name: 'Free',
    priceId: undefined,
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
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen p-4 md:p-8">
        <div className="text-center mb-12 md:mb-16">
          <Skeleton className="h-10 md:h-12 w-3/4 md:w-1/2 mx-auto mb-4 bg-gray-300" />
          <Skeleton className="h-6 w-1/2 md:w-1/3 mx-auto bg-gray-300" />
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[450px] md:h-[500px] w-full bg-gray-300" />
          <Skeleton className="h-[450px] md:h-[500px] w-full bg-gray-300" />
          <Skeleton className="h-[450px] md:h-[500px] w-full bg-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full bg-[#F0F0F0] text-[#111111] min-h-screen p-4 md:p-8">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-xl sm:text-xl md:text-xl font-black tracking-tight">
          CHOOSE YOUR PLAN
        </h1>
        <p className="mt-4 text-base text-center md:text-lg text-black/70 max-w-2xl mx-auto">
          Simple, transparent pricing. No hidden fees. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-row justify-between items-stretch">
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

