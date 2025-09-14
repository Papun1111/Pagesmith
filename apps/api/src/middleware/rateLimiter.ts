import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express'; // Import the getAuth helper
import { redisClient } from '../config/redis.js';
import User from '../models/User.js';

/**
 * Defines the rate limiting rules for each subscription plan.
 * - free: Generous enough for casual use.
 * - demon: Suitable for power users and small teams.
 * - hashira: Designed for heavy usage and larger teams.
 */
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

/**
 * A flexible, plan-based rate limiting middleware using a sliding window algorithm with Redis.
 * This middleware should be placed AFTER an authentication middleware (like `requireAuth`).
 *
 * How it works:
 * 1. It identifies the user via `getAuth(req)`.
 * 2. It fetches the user's subscription plan from MongoDB, caching the result in Redis for performance.
 * 3. It applies the corresponding rate limit from the `PLAN_LIMITS` configuration.
 * 4. It uses a Redis Sorted Set to track request timestamps for the user within the defined time window.
 * 5. If the user exceeds their limit, it responds with a 429 "Too Many Requests" error.
 */
export const planBasedRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // The getAuth() helper must be called with the entire request object (`req`).
    const { userId } = getAuth(req);

    if (!userId) {
      // This case should be handled by `requireAuth` middleware before this one runs.
      // However, as a safeguard, we deny the request if no userId is present.
      return res.status(401).json({ message: 'Unauthorized. Cannot apply rate limit.' });
    }

    // Step 1: Fetch user's plan from our database, with caching in Redis for performance.
    const userCacheKey = `user-plan:${userId}`;
    let userPlan = await redisClient.get(userCacheKey);

    if (!userPlan) {
      const user = await User.findOne({ clerkId: userId }).select('plan');
      userPlan = user?.plan || 'free'; // Default to 'free' if no user or plan is found.
      // Cache the result for 5 minutes (300 seconds) to reduce database load.
      await redisClient.set(userCacheKey, userPlan, { EX: 300 });
    }

    // Step 2: Get the rate limit configuration for the user's plan.
    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    const { windowInSeconds, maxRequests } = limits;

    // Step 3: Implement the sliding window rate limiting logic in Redis.
    const key = `rate-limit:${userId}`;
    const now = Date.now();
    const windowStart = now - windowInSeconds * 1000;

    // Use a Redis transaction (MULTI/EXEC) to ensure all commands run atomically.
    const multi = redisClient.multi();
    // Command 1: Remove all request timestamps older than the current window.
    multi.zRemRangeByScore(key, 0, windowStart);
    // Command 2: Add the timestamp of the current request. The value can be the same as score for simplicity.
    multi.zAdd(key, { score: now, value: now.toString() });
    // Command 3: Count how many requests remain in the current window.
    multi.zCard(key);
    // Command 4: Set an expiration on the key itself to auto-clean Redis memory for inactive users.
    multi.expire(key, windowInSeconds);

    const results = await multi.exec();
    // The result of zCard is at index 2 of the results array.
    const requestCount = results[2] as unknown as number;

    // Step 4: Check if the user has exceeded the limit.
    if (requestCount > maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. You have exceeded your plan limit.',
      });
    }

    next();
  } catch (error) {
    // If any error occurs (e.g., Redis is down), we "fail open" to not block users.
    // This is a safe default, but in a stricter production environment, you might log this
    // to a monitoring service like Sentry or DataDog.
    console.error('Error in rate limiter middleware:', error);
    next();
  }
};

