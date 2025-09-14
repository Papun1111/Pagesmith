import mongoose, { Schema, Document } from 'mongoose';

// Define the possible access levels for collaborators.
export const AccessTypes = {
  READ: 'read',
  WRITE: 'write',
} as const;

type AccessType = typeof AccessTypes[keyof typeof AccessTypes];

// Interface for a collaborator entry.
interface ICollaborator {
  userId: string; // The clerkId of the collaborator
  accessType: AccessType;
}

// Interface representing a single Canvas document in MongoDB.
export interface ICanvas extends Document {
  title: string;
  content: string; // Stores the content of the canvas, expected to be in Markdown format
  ownerId: string; // The clerkId of the user who owns the canvas
  collaborators: ICollaborator[]; // An array of users with whom the canvas is shared
  createdAt: Date;
  updatedAt: Date;
}

// Schema for the collaborators sub-document.
const CollaboratorSchema: Schema = new Schema(
  {
    // The Clerk ID of the user being granted access.
    userId: {
      type: String,
      required: true,
    },
    // The level of access granted to this user.
    accessType: {
      type: String,
      enum: Object.values(AccessTypes),
      required: true,
      default: AccessTypes.READ,
    },
  },
  { _id: false } // Prevents Mongoose from creating an _id for sub-documents
);

const CanvasSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Canvas',
    },
    // The main content of the canvas. This will be updated in real-time via WebSockets.
    content: {
      type: String,
      default: '# Welcome to your new canvas!\n\nStart typing here...',
    },
    // The clerkId of the document's owner. Crucial for determining permissions.
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    // An array to manage sharing and collaborative permissions.
    collaborators: [CollaboratorSchema],
  },
  {
    // Automatically adds and manages `createdAt` and `updatedAt` timestamps.
    timestamps: true,
  }
);

// Create and export the Canvas model.
export default mongoose.model<ICanvas>('Canvas', CanvasSchema);
