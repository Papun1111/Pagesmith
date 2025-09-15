import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';


interface UserData {
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}


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
      {
        $set: cleanUpdateData,
      },
      {
        new: true, // Return the modified document rather than the original.
        upsert: true, // Create a new document if one doesn't exist.
        runValidators: true, // Ensure the update operation adheres to schema validation.
      }
    );

    logger.info(`User upserted successfully for clerkId: ${clerkId}`);
    return user;
  } catch (error) {
    logger.error(`Error in createOrUpdateUser for clerkId ${userData.clerkId}:`, error);
    // Re-throw as a standardized ApiError.
    throw new ApiError(500, 'Database operation failed while creating or updating user.');
  }
};

