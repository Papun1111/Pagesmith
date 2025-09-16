'use client';

import { useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
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

  /**
   * Handles the click event for the checkout button.
   * It calls a frontend API route to create a Stripe Checkout session
   * and then redirects the user to the Stripe-hosted checkout page.
   */
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: tier.priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session.');
      }

      const { url } = await response.json();
      // Redirect the user to the Stripe Checkout page.
      window.location.href = url;
    } catch (error) {
      console.error('Checkout Error:', error);
      // Here you might want to show an error toast to the user.
      setIsLoading(false);
    }
  };

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
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading || tier.isCurrentPlan}
          variant={tier.isMostPopular ? 'default' : 'outline'}
        >
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {tier.isCurrentPlan ? 'Your Current Plan' : 'Get Started'}
        </Button>
      </CardFooter>
    </Card>
  );
}
