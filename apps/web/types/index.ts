/**
 * Defines the possible access levels for a collaborator on a canvas.
 */
export type AccessType = 'read' | 'write';

/**
 * Represents a collaborator on a Canvas, storing their ID and access level.
 */
export interface Collaborator {
  userId: string;
  accessType: AccessType;
}

/**
 * Represents the main Canvas document structure.
 * This should mirror the ICanvas interface from the backend.
 */
export interface Canvas {
  _id: string; // MongoDB's unique identifier
  title: string;
  content: string;
  ownerId: string;
  collaborators: Collaborator[];
  createdAt: string; // Dates are typically serialized as strings over JSON
  updatedAt: string;
}


export type SubscriptionPlan = 'free' | 'demon' | 'hashira';

export interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  id: SubscriptionPlan;
  name: string;
  priceId?: string; 
  priceMonthly: number;
  description: string;
  features: string[];
  isCurrentPlan?: boolean; 
  isMostPopular?: boolean; 
}
