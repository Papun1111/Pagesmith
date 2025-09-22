'use client';

import { UserButton } from '@clerk/nextjs';
import {  dark } from '@clerk/themes'
/**
 * A simple wrapper around Clerk's UserButton component to ensure it's a client component.
 * This provides out-of-the-box functionality for profile management, signing out, etc.
 */
export function UserProfileButton() {
  return (
    <UserButton
      showName={false}
      appearance={{
        elements: {
          avatarBox: "h-9 w-9"
        },
        baseTheme: [ dark]
      }}
    />
  );
}
