/** Return to the public sign-in page so the recovered session can be validated. */
export function adminAuthLinks(origin: string) {
  return {
    signIn: new URL('/auth', origin).href,
    resetPassword: new URL('/reset-password', origin).href,
  };
}