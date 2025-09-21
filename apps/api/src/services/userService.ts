import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// Interface describing the expected data structure for creating/updating a user.
interface UserData {
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}

/**
 * Creates a new user or updates an existing one in the database based on the Clerk ID.
 */
export const createOrUpdateUser = async (userData: UserData) => {
  if (!userData.clerkId) {
    throw new ApiError(400, 'Clerk ID is required to create or update a user.');
  }

  try {
    const { clerkId, ...updateData } = userData;

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    const user = await User.findOneAndUpdate(
      { clerkId: clerkId },
      { $set: cleanUpdateData },
      { new: true, upsert: true, runValidators: true }
    );

    logger.info(`User upserted successfully for clerkId: ${clerkId}`);
    return user;
  } catch (error) {
    logger.error(`Error in createOrUpdateUser for clerkId ${userData.clerkId}:`, error);
    throw new ApiError(500, 'Database operation failed while creating or updating user.');
  }
};

/**
 * Finds a user by their Clerk ID. If the user is not found in the local database,
 * it fetches their data from the Clerk API and creates them "just-in-time".
 * This resolves race conditions that occur after sign-up.
 * @param clerkId - The Clerk ID of the user to find.
 * @returns The user document.
 */
export const findUserByClerkId = async (clerkId: string) => {
  if (!clerkId) {
    throw new ApiError(400, 'Clerk ID is required.');
  }
  
  let user = await User.findOne({ clerkId });

  // If user is not found, attempt to create them just-in-time.
  if (!user) {
    logger.warn(`User ${clerkId} not found in DB. Attempting to create just-in-time.`);
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
      
      user = await createOrUpdateUser({
        clerkId: clerkUser.id??"",
        email: primaryEmail??"",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
      logger.info(`Successfully created user ${clerkId} just-in-time.`);
    } catch (error) {
        logger.error(`Failed to fetch or create user from Clerk API for clerkId ${clerkId}:`, error);
        // If we fail to create the user, we must throw the not found error.
        throw new ApiError(404, 'User not found.'); 
    }
  }

  return user;
};

