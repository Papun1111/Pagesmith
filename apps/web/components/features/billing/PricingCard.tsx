/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
// FIX: Import the `useUser` hook to get user details.
import {  useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type PricingTier } from '@/types';
import { toast } from 'sonner';

// This informs TypeScript that the Razorpay object will be available globally
// because we included their script in the main layout.
declare const Razorpay: any;

interface PricingCardProps {
  tier: PricingTier;
}

/**
 * A UI component to display a single subscription plan/pricing tier,
 * now fully integrated with the Razorpay payment flow.
 */
export function PricingCard({ tier }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // FIX: Use the `useUser` hook to get the user object for pre-filling details.
  const { user } = useUser();
  const router = useRouter();

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create a Razorpay order on your backend via your frontend API route.
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tier.id }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create payment order.');
      }

      const order = await orderResponse.json();

      // Step 2: Configure and open the Razorpay checkout modal.
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "PageSmith",
        description: `Purchase ${tier.name} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          // Step 3: Verify the payment on your backend after the user pays.
          try {
            const verificationResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.json();
              throw new Error(errorData.message || 'Payment verification failed.');
            }
            
            toast.success('Payment Successful! Your plan has been upgraded.');
            // Redirect to the dashboard to reflect the new plan.
            router.push('/dashboard');

          } catch (verifyError: any) {
             setError(verifyError.message);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: "#14213d",
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response: any){
            setError(`Payment failed: ${response.error.description}`);
            console.error(response.error);
      });
      rzp.open();

    } catch (err: unknown) {
      console.error('Checkout Error:', err);
      if(err instanceof Error){
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isActionable = tier.id !== 'free';

  return (
    <div className={cn(
        "border border-black p-6 flex flex-col relative h-full dark:border-slate-700",
        tier.isMostPopular 
            ? "bg-black text-white dark:bg-slate-800 dark:text-white" 
            : "bg-[#F0F0F0] text-black dark:bg-slate-900 dark:text-white"
    )}>
        {tier.isMostPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[#FF4136] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Most Popular
            </div>
        )}
        
        <h3 className="text-2xl font-black">{tier.name}</h3>
        <p className={cn("mt-2 text-sm min-h-[40px]", tier.isMostPopular ? "text-white/80" : "text-black/70 dark:text-slate-400")}>{tier.description}</p>
        
        <div className="mt-6">
            <span className="text-4xl font-black">${tier.priceMonthly}</span>
            <span className={cn("text-md", tier.isMostPopular ? "text-white/70" : "text-black/60 dark:text-slate-400")}>/month</span>
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
                            ? "bg-transparent border-2 border-black text-black cursor-not-allowed dark:border-slate-600 dark:text-slate-400"
                            : tier.isMostPopular
                            ? "bg-white text-black hover:bg-white/90"
                            : "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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

