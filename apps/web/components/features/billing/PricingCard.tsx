'use client';

import { useState } from 'react';
import { Check, LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type PricingTier } from '@/types';

interface PricingCardProps {
  tier: PricingTier;
}

/**
 * A UI component to display a single subscription plan/pricing tier.
 * It shows the plan's name, price, features, and a call-to-action button.
 */
export function PricingCard({ tier }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the click event for the checkout button.
   * It calls a frontend API route to create a Stripe Checkout session
   * and then redirects the user to the Stripe-hosted checkout page.
   */
  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null); // Reset error on a new attempt

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: tier.priceId }),
      });

      // If the response is not OK, parse the error message from the body.
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          // Fallback if the response body isn't valid JSON
          message: `Request failed with status: ${response.status}`,
        }));
        throw new Error(errorData.message || 'Failed to create checkout session.');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("Checkout URL not found in the server's response.");
      }
      
      // Redirect the user to the Stripe Checkout page.
      window.location.href = url;

    } catch (err: any) {
      console.error('Checkout Error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // The free plan should not be "purchasable".
  const isActionable = tier.id !== 'free';

  return (
    <Card className={cn("flex flex-col", { "border-purple-500 shadow-lg": tier.isMostPopular })}>
      {tier.isMostPopular && (
        <div className="py-1 px-3 bg-purple-500 text-white text-xs font-semibold rounded-t-lg text-center">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <span className="text-4xl font-bold">${tier.priceMonthly}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-stretch">
        {isActionable && (
          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={isLoading || tier.isCurrentPlan}
            variant={tier.isMostPopular ? 'default' : 'outline'}
          >
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {tier.isCurrentPlan ? 'Your Current Plan' : 'Get Started'}
          </Button>
        )}
        {/* Display an error message directly on the card if one occurs */}
        {error && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

