import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { UserProfile } from '../../types/profile.types';
import { isAdminUser, shouldRedirectToProfileSetup, getPostAuthRedirectPath } from '../../utils/userUtils';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile from Firestore (this will auto-fix completion status)
        const profile = await profileService.getProfile(user.uid);
        setUserProfile(profile);
        
        // If email verification status changed, update profile in Firestore
        if (profile && profile.emailVerified !== user.emailVerified) {
          try {
            await profileService.updateProfile({
              emailVerified: user.emailVerified
            });
            // Refresh profile after update
            const updatedProfile = await profileService.getProfile(user.uid);
            setUserProfile(updatedProfile);
          } catch (error) {
            console.error('Error updating email verification status:', error);
          }
        }
      } else {
        setUserProfile(null);
        setHasNavigated(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle automatic navigation after authentication
  useEffect(() => {
    if (user && userProfile && !loading && !hasNavigated && user.emailVerified) {
      setHasNavigated(true);
      
      // Check if we're on an auth page and need to redirect
      const currentHash = window.location.hash;
      const isOnAuthPage = currentHash.includes('#auth/') || currentHash === '#profile/setup' || currentHash === '#home' || currentHash === '' || currentHash === '#';
      
      if (isOnAuthPage) {
        // Small delay to ensure all state is settled
        setTimeout(() => {
          // Admin users ALWAYS go to admin dashboard after email verification
          if (isAdminUser(userProfile)) {
            console.log('AuthContext: Admin user detected, navigating to admin dashboard');
            window.location.hash = getPostAuthRedirectPath(userProfile);
            return;
          }
          
          // Regular users: check if profile needs completion
          if (shouldRedirectToProfileSetup(userProfile)) {
            console.log('AuthContext: Profile incomplete, redirecting to profile setup');
            window.location.hash = '#profile/setup';
            return;
          }
          
          // Default to user zone profile page for complete profiles
          console.log('AuthContext: Profile complete, redirecting to profile edit');
          window.location.hash = getPostAuthRedirectPath(userProfile);
        }, 100);
      }
    }
  }, [user, userProfile, loading, hasNavigated, user?.emailVerified]);
  const refreshUserProfile = async () => {
    if (user) {
      const profile = await profileService.getProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    signOut,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
