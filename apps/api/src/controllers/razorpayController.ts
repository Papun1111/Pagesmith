import type{ Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import * as BillingService from '../services/billingService.js';

export const handleCreateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    const { plan } = req.body;
    const order = await BillingService.createRazorpayOrder(userId!, plan);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const handleVerifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await BillingService.verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};