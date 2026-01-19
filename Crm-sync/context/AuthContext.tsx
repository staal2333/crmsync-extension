import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      console.log('🔐 AuthContext: Initializing auth, token exists:', !!storedToken);
      
      if (storedToken) {
        try {
          console.log('🔄 AuthContext: Fetching user profile...');
          const userData = await authService.getProfile(storedToken);
          console.log('✅ AuthContext: User profile loaded:', userData.email);
          setUser(userData);
          setToken(storedToken);
          // Update stored user with fresh data
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error: any) {
          console.error("❌ AuthContext: Failed to load profile:", error);
          
          // Only logout if it's a 401 (unauthorized)
          if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.log('🔓 AuthContext: Token invalid, logging out');
            logout();
          } else {
            // For network errors, use cached user data if available
            if (storedUser) {
              try {
                const cachedUser = JSON.parse(storedUser);
                console.log('💾 AuthContext: Using cached user data:', cachedUser.email);
                setUser(cachedUser);
                setToken(storedToken);
              } catch (parseError) {
                console.error('Failed to parse cached user:', parseError);
                setToken(storedToken);
              }
            } else {
              console.log('⚠️ AuthContext: Network error, no cached user, keeping token for retry');
              setToken(storedToken);
            }
          }
        }
      } else {
        console.log('📝 AuthContext: No token found, user not logged in');
      }
      setIsLoading(false);
    };

    initAuth();

    // ✅ NEW: Listen for logout from extension (bidirectional sync)
    const handleExtensionLogout = () => {
      console.log('📥 Extension logged out, logging out website...');
      logout();
    };

    window.addEventListener('crmsync-logout-from-extension', handleExtensionLogout);

    // Cleanup
    return () => {
      window.removeEventListener('crmsync-logout-from-extension', handleExtensionLogout);
    };
  }, []);

  const login = (newToken: string, newUser: User, refreshToken?: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser)); // Store user as backup
    
    // Store refresh token if provided
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      console.log('💾 AuthContext: Refresh token stored');
    }
    
    setToken(newToken);
    setUser(newUser);
    console.log('✅ AuthContext: User logged in and stored:', newUser.email);
    
    // Notify extension about login (bidirectional sync)
    if (typeof window !== 'undefined' && (window as any).CRMSyncExtension) {
      try {
        console.log('📤 Notifying extension of website login');
        (window as any).CRMSyncExtension.notifyLogin({
          token: newToken,
          refreshToken: refreshToken,
          user: newUser
        });
      } catch (error) {
        console.error('Failed to notify extension:', error);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('🔓 AuthContext: User logged out');
    
    // Notify extension about logout (bidirectional sync)
    if (typeof window !== 'undefined' && (window as any).CRMSyncExtension) {
      try {
        console.log('📤 Notifying extension of website logout');
        (window as any).CRMSyncExtension.notifyLogout();
      } catch (error) {
        console.error('Failed to notify extension:', error);
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    if (!token) {
      throw new Error('No authentication token');
    }
    
    try {
      const userData = await authService.getProfile(token);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};