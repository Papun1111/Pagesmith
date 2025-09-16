'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PricingCard } from '@/components/features/billing/PricingCard';
import { apiClient } from '@/lib/api';
import type { PricingTier, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// --- Pricing Data ---
// This data defines the different subscription tiers for your application.
// IMPORTANT: Replace 'price_...' with your actual Stripe Price IDs.
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

/**
 * The main pricing page component.
 * It fetches the user's current plan and displays the available subscription tiers.
 */
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
          // Assuming an endpoint exists in your apiClient to fetch the user's profile.
          // This would call your backend's GET /api/user/profile endpoint.
          const profile = await apiClient.getUserProfile(token);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // It's okay to fail silently; the user will be treated as being on the free plan.
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [getToken]);

  const currentPlan = userProfile?.plan || 'free';

  // Display loading skeletons while fetching user data for a better UX.
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl py-12 px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the Right Plan for You
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Simple, transparent pricing. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
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
    </div>
  );
}
