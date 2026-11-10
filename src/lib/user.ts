export interface UserOnboardState {
  onboardedAt?: Date | string | null;
  isOnboarded?: boolean;
}

/**
 * Single source of truth for onboarding status across client and server.
 * Returns true if the user has completed onboarding (onboardedAt timestamp exists).
 */
export function isUserOnboarded(
  user: UserOnboardState | null | undefined
): boolean {
  if (!user) return false;
  return Boolean(user.onboardedAt || user.isOnboarded);
}

