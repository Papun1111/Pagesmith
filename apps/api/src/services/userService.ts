import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import { isSpecialAccessEmail } from '../config/specialAccess.js';

interface UserData {
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}

/**
 * Creates a new user or updates an existing one in the database.
 * 
 * Plan logic:
 * - New users get 'free' by default (via schema default)
 * - Special email users ALWAYS get 'hashira' (on creation AND every update)
 * - For regular existing users, the plan is NEVER changed by webhooks
 * - Only the billing service can change plans for regular existing users
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

    // Ensure email is always present, as it is required by the Mongoose schema.
    // If Clerk didn't provide one (e.g. phone number signup), generate a placeholder.
    if (!cleanUpdateData.email) {
      cleanUpdateData.email = `${clerkId}@placeholder.local`;
      userData.email = cleanUpdateData.email;
    }

    const isSpecial = isSpecialAccessEmail(userData.email);

    // Check if user already exists (by clerkId OR email)
    // Finding by email handles cases where a user deletes their Clerk account
    // and re-creates it with the same email, but gets a new clerkId.
    let existingUser = await User.findOne({ clerkId });
    
    if (!existingUser && cleanUpdateData.email) {
      existingUser = await User.findOne({ email: cleanUpdateData.email });
      if (existingUser) {
        logger.info(`Found existing user by email ${cleanUpdateData.email}. Updating clerkId from ${existingUser.clerkId} to ${clerkId}.`);
      }
    }

    if (existingUser) {
      // --- Existing user ---
      // Special emails: ALWAYS ensure they have hashira (even if manually changed)
      // Regular users: NEVER touch their plan (prevents webhook from overwriting paid plans)
      const updatePayload: Record<string, any> = { ...cleanUpdateData };

      if (isSpecial && existingUser.plan !== 'hashira') {
        updatePayload.plan = 'hashira';
        logger.info(`Restoring Hashira access for special user: ${userData.email}`);
      }

      // We must search by the existingUser's clerkId (in case it changed)
      // and explicitly step the clerkId to the new one in the update payload.
      updatePayload.clerkId = clerkId;

      const user = await User.findOneAndUpdate(
        { clerkId: existingUser.clerkId },
        { $set: updatePayload },
        { new: true, runValidators: true }
      );
      logger.info(`User updated for clerkId: ${clerkId} (plan: ${user?.plan})`);
      return user;
    } else {
      // --- New user: determine the initial plan ---
      const initialPlan = isSpecial ? 'hashira' : 'free';

      if (isSpecial) {
        logger.info(`Granting special Hashira access to new user: ${userData.email}`);
      }

      const user = await User.create({
        clerkId,
        ...cleanUpdateData,
        plan: initialPlan,
      });

      logger.info(`New user created for clerkId: ${clerkId} with plan: ${initialPlan}`);
      return user;
    }
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
    } catch (clerkError: any) {
      logger.warn(`Clerk API lookup failed for ${clerkId}: ${clerkError.message}. Creating minimal user.`);
      // Fallback: create a minimal user document so the app doesn't crash.
      // The user's profile will be enriched on their next webhook event.
      try {
        user = await User.create({ clerkId, email: `${clerkId}@placeholder.local`, plan: 'free' });
        logger.info(`Created minimal fallback user for ${clerkId}.`);
      } catch (createError: any) {
        // If even this fails (e.g. duplicate key), try to find again
        user = await User.findOne({ clerkId });
        if (!user) {
          throw new ApiError(500, 'Failed to create or find user after multiple attempts.');
        }
      }
    }
  }

  // --- Special access enforcement: ensure special emails ALWAYS have hashira ---
  // This runs on every lookup, so even if the user was created before being
  // added to the special list, they get upgraded on their next API call.
  if (user && isSpecialAccessEmail(user.email) && user.plan !== 'hashira') {
    user.plan = 'hashira';
    await user.save();
    logger.info(`Auto-upgraded special access user ${user.email} to hashira plan.`);
  }

  return user;
};
