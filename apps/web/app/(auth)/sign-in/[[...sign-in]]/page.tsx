import { SignIn } from "@clerk/nextjs";
import { dark, neobrutalism } from '@clerk/themes'
/**
 * Renders the Clerk sign-in component.
 * The `[[...sign-in]]` folder structure is a catch-all route that allows
 * Clerk to handle all sub-routes required for its authentication flow,
 * such as multi-factor authentication steps.
 */
export default function SignInPage() {
  return <SignIn  appearance={{
    baseTheme: [dark, neobrutalism],
  }}/>;
}
