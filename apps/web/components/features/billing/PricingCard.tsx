/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type PricingTier } from '@/types';
import { toast } from 'sonner';

// This informs TypeScript that the Razorpay object will be available globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Razorpay: any;

interface PricingCardProps {
  tier: PricingTier;
}

/**
 * A UI component to display a single subscription plan/pricing tier,
 * styled with a Neo-Brutalist aesthetic.
 */
export function PricingCard({ tier }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
             toast.error(verifyError.message);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: "#000000",
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
    <div 
      className={cn(
        "relative flex flex-col h-full p-8 transition-all duration-200",
        "border-2 border-black dark:border-white bg-white dark:bg-[#111111]",
        "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]",
        "hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]",
        tier.isMostPopular && "ring-2 ring-offset-4 ring-black dark:ring-white dark:ring-offset-[#111111]"
      )}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
        {tier.isMostPopular && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FF4136] text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] whitespace-nowrap z-10">
                Most Popular
            </div>
        )}
        
        <div className="mb-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white mb-2">{tier.name}</h3>
            <p className="text-sm font-medium text-black/60 dark:text-white/60 leading-relaxed min-h-[40px]">{tier.description}</p>
        </div>
        
        <div className="mb-8 flex items-baseline">
            <span className="text-5xl font-black text-black dark:text-white">${tier.priceMonthly}</span>
            <span className="text-lg font-bold text-black/40 dark:text-white/40 ml-2">/mo</span>
        </div>
        
        <ul className="space-y-4 flex-grow mb-8">
            {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 p-0.5 bg-black dark:bg-white text-white dark:text-black rounded-none flex-shrink-0">
                        <Check className="h-3 w-3 stroke-[4]" />
                    </div>
                    <span className="text-sm font-bold text-black/80 dark:text-white/80">{feature}</span>
                </li>
            ))}
        </ul>

        <div className="mt-auto">
            {isActionable && (
                <Button
                    className={cn(
                        "w-full h-14 rounded-none font-black text-base uppercase tracking-widest transition-all",
                        tier.isCurrentPlan
                            ? "bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700"
                            : "bg-black text-white border-2 border-black hover:bg-white hover:text-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    )}
                    onClick={handleCheckout}
                    disabled={isLoading || tier.isCurrentPlan}
                >
                    {isLoading && <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />}
                    {tier.isCurrentPlan ? 'Current Plan' : 'Get Started'}
                </Button>
            )}
            
            {/* Free plan button (disabled visual state) */}
            {!isActionable && (
                 <Button
                    className="w-full h-14 rounded-none font-black text-base uppercase tracking-widest bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-default dark:bg-neutral-900 dark:text-neutral-600 dark:border-neutral-800"
                    disabled
                >
                    Free Forever
                </Button>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 flex items-start gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold uppercase">{error}</span>
                </div>
            )}
        </div>
    </div>
  );
}