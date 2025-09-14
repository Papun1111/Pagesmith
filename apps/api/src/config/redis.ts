import { createClient } from 'redis';
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error('FATAL ERROR: REDIS_URL is not defined in the environment variables.');

  process.exit(1);
}
export const redisClient: ReturnType<typeof createClient> = createClient({
  url: redisUrl,
});


redisClient.on('connect', () => {
  console.log('Redis client connected successfully.');
});


redisClient.on('error', (err) => {
  console.error('Redis client connection error:', err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }
})();