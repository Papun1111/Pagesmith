'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("User not authenticated.");
        const profile = await apiClient.getUserProfile(token);
        setUserProfile(profile);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        setError("Could not load your subscription details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [getToken]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-10 w-48 mt-4" />
        </div>
      );
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }

    if (userProfile) {
      const isFreePlan = userProfile.plan === 'free';
      return (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-xl font-semibold">Current Plan</h3>
            <Badge variant={isFreePlan ? "secondary" : "default"} className="capitalize">
              {userProfile.plan}
            </Badge>
          </div>
          <CardDescription>
            {isFreePlan
              ? "You are currently on the Free plan."
              : `You are subscribed to the ${userProfile.plan.charAt(0).toUpperCase() + userProfile.plan.slice(1)} plan.`}
          </CardDescription>
          
          {/* If on a free plan, show an "Upgrade" button that links to the pricing page. */}
          {isFreePlan && (
            <div className="mt-6">
                <Button asChild>
                    <Link href="/pricing">Upgrade Plan</Link>
                </Button>
            </div>
          )}

          {/* For paid plans, you could add a "Cancel Subscription" button here in the future,
              which would call a new backend endpoint. */}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

