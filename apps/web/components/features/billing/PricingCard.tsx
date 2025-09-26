'use client';

import { useState } from 'react';
import { Check, LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type PricingTier } from '@/types';

interface PricingCardProps {
  tier: PricingTier;
}

/**
 * A UI component to display a single subscription plan/pricing tier,
 * styled to match the application's new design language.
 */
export function PricingCard({ tier }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tier.priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status: ${response.status}`,
        }));
        throw new Error(errorData.message || 'Failed to create checkout session.');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("Checkout URL not found in the server's response.");
      }
      
      window.location.href = url;

    } catch (err: unknown) {
      console.error('Checkout Error:', err);
      if(err instanceof Error){
      if (err.message && err.message.includes('User not found')) {
        setError('Your account is still being set up. Please wait a moment and try again.');
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  }
  };

  const isActionable = tier.id !== 'free';

  return (
    <div className={cn(
        "border border-black p-6 flex flex-col relative h-full",
        tier.isMostPopular ? "bg-black text-white" : "bg-[#F0F0F0] text-black"
    )}>
        {tier.isMostPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[#FF4136] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Most Popular
            </div>
        )}
        
        <h3 className="text-2xl font-black">{tier.name}</h3>
        <p className={cn("mt-2 text-sm min-h-[40px]", tier.isMostPopular ? "text-white/80" : "text-black/70")}>{tier.description}</p>
        
        <div className="mt-6">
            <span className="text-4xl font-black">${tier.priceMonthly}</span>
            <span className={cn("text-md", tier.isMostPopular ? "text-white/70" : "text-black/60")}>/month</span>
        </div>
        
        <ul className="mt-6 space-y-3 flex-grow">
            {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>

        <div className="mt-8">
            {isActionable && (
                <Button
                    className={cn(
                        "w-full rounded-none font-bold py-5 text-base transition-colors",
                        tier.isCurrentPlan
                            ? "bg-transparent border-2 border-black text-black cursor-not-allowed"
                            : tier.isMostPopular
                            ? "bg-white text-black hover:bg-white/90"
                            : "bg-black text-white hover:bg-black/80"
                    )}
                    onClick={handleCheckout}
                    disabled={isLoading || tier.isCurrentPlan}
                >
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {tier.isCurrentPlan ? 'Your Current Plan' : 'Get Started'}
                </Button>
            )}
            {error && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    </div>
  );
}
