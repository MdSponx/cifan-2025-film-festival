import { UserProfile } from '../types/profile.types';

/**
 * Utility functions for user-related operations
 */

/**
 * Check if a user is an admin (admin or super-admin)
 */
export const isAdminUser = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  return userProfile.role === 'admin' || userProfile.role === 'super-admin';
};

/**
 * Check if a user profile is complete based on actual field values
 * Admin users are always considered to have complete profiles
 */
export const isProfileComplete = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // Admin users always have complete profiles
  if (isAdminUser(userProfile)) {
    return true;
  }
  
  // Regular users need all required fields with meaningful values
  const hasRequiredFields = !!(
    userProfile.fullNameEN && 
    userProfile.fullNameEN.trim().length > 0 &&
    userProfile.email && 
    userProfile.email.trim().length > 0 &&
    userProfile.phoneNumber && 
    userProfile.phoneNumber.trim().length > 0 &&
    userProfile.birthDate &&
    userProfile.birthDate.getFullYear() > 1900 && // Reasonable birth year
    userProfile.birthDate.getFullYear() < new Date().getFullYear()
  );

  return hasRequiredFields;
};

/**
 * Get the appropriate redirect path after authentication based on user role
 */
export const getPostAuthRedirectPath = (userProfile: UserProfile | null, fallback: string = '#profile/edit'): string => {
  if (!userProfile) return fallback;
  
  if (isAdminUser(userProfile)) {
    return '#admin/dashboard';
  }
  
  return fallback;
};

/**
 * Check if a user should be redirected to profile setup
 */
export const shouldRedirectToProfileSetup = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // Admin users never need profile setup
  if (isAdminUser(userProfile)) {
    return false;
  }
  
  // Regular users need profile setup if profile is incomplete (check actual fields)
  return !isProfileComplete(userProfile);
};

/**
 * Check if a user can access a protected route that requires profile completion
 */
export const canAccessProfileProtectedRoute = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // Admin users can always access protected routes
  if (isAdminUser(userProfile)) {
    return true;
  }
  
  // Regular users need complete profiles (check actual fields)
  return isProfileComplete(userProfile);
};
