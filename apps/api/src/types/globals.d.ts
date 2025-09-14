/**
 * This file provides a global type reference for the Clerk Express middleware.
 * By referencing '@clerk/express/env', we instruct TypeScript to load the
 * augmented type definitions provided by Clerk.
 *
 * This augmentation correctly types the return value of the `getAuth()` helper,
 * ensuring that properties like `userId` are recognized, which resolves
 * "Property 'userId' does not exist on type 'AuthObject'" errors.
 *
 * This file should be included in your `tsconfig.json`'s path to be effective.
 * Placing it within the `src` directory usually accomplishes this automatically.
 */
/// <reference types="@clerk/express/env" />
