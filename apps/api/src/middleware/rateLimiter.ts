import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { redisClient } from '../config/redis.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// --- NEW: Define the list of emails that should bypass rate limiting ---
const specialAccessEmails = [
  'gohanmohapatra@gmail.com',
];

const PLAN_LIMITS = {
  free: {
    windowInSeconds: 3600, // 1 hour
    maxRequests: 100,
  },
  demon: {
    windowInSeconds: 3600, // 1 hour
    maxRequests: 500,
  },
  hashira: {
    windowInSeconds: 3600, // 1 hour
    maxRequests: 2000,
  },
};

export const planBasedRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. Cannot apply rate limit.' });
    }

    const userCacheKey = `user-plan:${userId}`;
    let userPlan = await redisClient.get(userCacheKey);

    if (!userPlan) {
      // Fetch user from our database to get their plan and email.
      const user = await User.findOne({ clerkId: userId }).select('plan email');

      // --- NEW: Check if the user's email grants special access ---
      // If it does, bypass all rate limiting logic and proceed.
      if (user?.email && specialAccessEmails.includes(user.email)) {
        logger.info(`Bypassing rate limit for special access user: ${user.email}`);
        return next();
      }
      
      userPlan = user?.plan || 'free';
      await redisClient.set(userCacheKey, userPlan, { EX: 300 });
    }

    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    const { windowInSeconds, maxRequests } = limits;

    const key = `rate-limit:${userId}`;
    const now = Date.now();
    const windowStart = now - windowInSeconds * 1000;

    const multi = redisClient.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zAdd(key, { score: now, value: now.toString() });
    multi.zCard(key);
    multi.expire(key, windowInSeconds);

    const results = await multi.exec();
    const requestCount = results[2] as unknown as number;

    if (requestCount > maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. You have exceeded your plan limit.',
      });
    }

    next();
  } catch (error) {
    console.error('Error in rate limiter middleware:', error);
    next();
  }
};
