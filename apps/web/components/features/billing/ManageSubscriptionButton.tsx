'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define the props for the component. This resolves the TypeScript error in the parent page.
interface ManageSubscriptionButtonProps {
  isFreePlan: boolean;
  stripeCustomerId?: string | null;
}


export function ManageSubscriptionButton({
  isFreePlan,
  stripeCustomerId,
}: ManageSubscriptionButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // If the user is on a free plan, redirect them to the pricing page to upgrade.
      if (isFreePlan) {
        router.push('/pricing');
        return;
      }

      // If the user has a paid plan, create a Stripe billing portal session.
      if (!stripeCustomerId) {
        throw new Error("Stripe customer ID not found.");
      }

      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session.');
      }

      const { url } = await response.json();
      // Redirect the user to the Stripe portal.
      window.location.href = url;
    } catch (error: unknown) {
      if(error instanceof Error){
      console.error(error);
      alert(`Error: ${error.message}`);
      setIsLoading(false);
      }
    }
  };

  const buttonText = isFreePlan ? 'Upgrade Plan' : 'Manage Subscription';

  return (
    <Button onClick={handleManageSubscription} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}

