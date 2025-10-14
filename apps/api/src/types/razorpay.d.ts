/**
 * This is a custom type declaration file for the 'razorpay' package.
 * Since the official 'razorpay' library doesn't include its own TypeScript types,
 * this file tells the TypeScript compiler to treat the module as type 'any'.
 * This prevents type errors when importing and using the Razorpay client.
 */
declare module 'razorpay' {
  // We declare the module and its default export as 'any' to bypass strict type checking.
  const Razorpay: any;
  export default Razorpay;
}
