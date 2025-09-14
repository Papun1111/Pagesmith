import mongoose, { Schema, Document } from 'mongoose';

export const UserPlans = {
  FREE: 'free',
  DEMON: 'demon',
  HASHIRA: 'hashira',
} as const; 


type Plan = typeof UserPlans[keyof typeof UserPlans];

// Interface representing a single User document in MongoDB.
export interface IUser extends Document {
  clerkId: string; // The unique identifier from Clerk.dev
  email: string; // User's email address, synced from Clerk
  plan: Plan; // The user's current subscription plan
  stripeCustomerId?: string; // The customer ID from Stripe for managing subscriptions
}

const UserSchema: Schema = new Schema(
  {

    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: Object.values(UserPlans),
      default: UserPlans.FREE,
      required: true,
    },

    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values, but unique if a value exists
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
  }
);

// Create and export the User model.
export default mongoose.model<IUser>('User', UserSchema);
