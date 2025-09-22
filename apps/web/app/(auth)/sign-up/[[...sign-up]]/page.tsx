import { SignUp } from "@clerk/nextjs";
import { neobrutalism } from '@clerk/themes'
/**
 * Renders the Clerk sign-up component.
 * The `[[...sign-up]]` folder structure is a catch-all route that allows
 * Clerk to handle all sub-routes required for its registration flow,
 * such as email verification.
 */
export default function SignUpPage() {
  return <SignUp appearance={{
    baseTheme: [ neobrutalism],
  }} />;
}
