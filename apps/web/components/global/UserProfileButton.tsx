'use client';

import { UserButton } from '@clerk/nextjs';

/**
 * A simple wrapper around Clerk's UserButton component to ensure it's a client component.
 * This provides out-of-the-box functionality for profile management, signing out, etc.
 */
export function UserProfileButton() {
  return (
    <UserButton
      showName
      appearance={{
        elements: {
          avatarBox: "h-9 w-9"
        }
      }}
    />
  );
}
