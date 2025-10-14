import Razorpay from 'razorpay';
import crypto from 'crypto';
import { findUserByClerkId } from './userService.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Map your internal plan names to prices in the smallest currency unit (e.g., paise for INR)
const PLAN_PRICES = {
    demon: 1000*100, // e.g., ₹1000.00
    hashira: 2500*100, // e.g., ₹2500.00
};

/**
 * Creates a Razorpay Order for a subscription plan.
 */
export const createRazorpayOrder = async (clerkId: string, plan: 'demon' | 'hashira') => {
  const user = await findUserByClerkId(clerkId);
  const amount = PLAN_PRICES[plan];

  if (!amount) {
    throw new ApiError(400, "Invalid plan specified.");
  }

  // FIX: Generate a shorter, random receipt ID to comply with Razorpay's 40-character limit.
  // This creates a highly unique ID that is well within the length constraint.
  const receiptId = `rcpt_${crypto.randomBytes(14).toString('hex')}`;

  const options = {
    amount: amount, // Amount in paise
    currency: "INR", // Or your desired currency
    receipt: receiptId,
    notes: {
      clerkId,
      plan,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    logger.info(`Razorpay order created for user ${clerkId} for plan ${plan}. Order ID: ${order.id}`);
    return order;
  } catch (error: any) {
    logger.error("Razorpay order creation failed:", error);
    throw new ApiError(500, `Razorpay Error: ${error.message}`);
  }
};

/**
 * Verifies the payment signature from Razorpay to confirm a successful transaction.
 */
export const verifyRazorpayPayment = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
) => {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, 'Invalid payment signature.');
    }

    // Signature is valid. Fetch order details to get user and plan info.
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { clerkId, plan } = order.notes as { clerkId: string, plan: 'demon' | 'hashira' };

    if (!clerkId || !plan) {
        throw new ApiError(400, 'Order is missing necessary user or plan information.');
    }

    // Update user's plan in the database
    await User.findOneAndUpdate(
        { clerkId },
        {
            plan,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
        },
        { new: true }
    );
    
    logger.info(`Payment verified and plan updated for user ${clerkId} to ${plan}.`);
    return { success: true, plan };
};

