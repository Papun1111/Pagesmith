import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// --- Define the list of special emails that get a free Hashira plan ---
const specialAccessEmails = [
  'gohanmohapatra@gmail.com',
  'papunmohapatra1111@gmail.com'
];

interface UserData {
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}

/**
 * Creates a new user or updates an existing one in the database.
 * Now includes special logic to grant the Hashira plan to specific emails.
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

    // --- Check if the user's email is in the special access list ---
    let planOverride = {};
    if (userData.email && specialAccessEmails.includes(userData.email)) {
      planOverride = { plan: 'hashira' };
      logger.info(`Granting special Hashira access to user: ${userData.email}`);
    }

    const user = await User.findOneAndUpdate(
      { clerkId: clerkId },
      // Merge the user data with the plan override.
      // The plan will default to 'free' unless overridden here.
      { 
        $set: {
            ...cleanUpdateData,
            ...planOverride
        },
        // Only set plan to 'free' on initial document creation if it's not being overridden.
        $setOnInsert: { plan: 'free' } 
      },
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
 * Finds a user by their Clerk ID. If not found, it creates them just-in-time.
 */
export const findUserByClerkId = async (clerkId: string) => {
  if (!clerkId) {
    throw new ApiError(400, 'Clerk ID is required.');
  }
  
  let user = await User.findOne({ clerkId });

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
    } catch (error: any) {
        logger.error(`Failed to fetch or create user from Clerk API for clerkId ${clerkId}:`, error.errors || error.message || error);
        throw new ApiError(404, 'User could not be verified with the authentication provider.'); 
    }
  }

  return user;
};

