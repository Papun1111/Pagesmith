import { Router } from 'express';
import { handleCreateOrder, handleVerifyPayment } from '../controllers/razorpayController.js';

const router :Router= Router();

router.post('/create-order', handleCreateOrder);
router.post('/verify-payment', handleVerifyPayment);

export default router;