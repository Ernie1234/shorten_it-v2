import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { JwtPayload } from '@repo/types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize as true
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('jwt_token');
      console.log('AuthContext: Checking for stored token...');

      if (storedToken) {
        try {
          const decodedUser = jwtDecode<JwtPayload>(storedToken);
          const currentTime = Date.now();
          const tokenExpirationTime = decodedUser.exp ? decodedUser.exp * 1000 : 0;

          console.log('AuthContext: Token found. Decoded user:', decodedUser);
          console.log('AuthContext: Current time:', new Date(currentTime).toLocaleString());
          console.log(
            'AuthContext: Token expires at:',
            new Date(tokenExpirationTime).toLocaleString(),
          );

          if (tokenExpirationTime > currentTime) {
            setToken(storedToken);
            setUser(decodedUser);
            console.log('AuthContext: Token is valid and set.');
          } else {
            console.log('AuthContext: Token expired. Removing from localStorage.');
            localStorage.removeItem('jwt_token');
          }
        } catch (e) {
          console.error('AuthContext: Failed to decode or validate token:', e);
          localStorage.removeItem('jwt_token');
        }
      } else {
        console.log('AuthContext: No stored token found.');
      }

      // Handle Google OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get('token');
      if (googleToken) {
        console.log('AuthContext: Google token found in URL. Logging in...');
        login(googleToken);
        urlParams.delete('token');
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + urlParams.toString(),
        );
      }
      setIsLoading(false);
      console.log('AuthContext: Initialization complete. isLoading set to false.');
    };

    initializeAuth();
  }, []);

  const login = (newToken: string) => {
    console.log('AuthContext: Login function called.');
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    const decodedUser = jwtDecode<JwtPayload>(newToken);
    setUser(decodedUser);
    queryClient.invalidateQueries(); // Invalidate all queries to refetch user-specific data
    console.log('AuthContext: User logged in, token and user state updated.');
  };

  const logout = () => {
    console.log('AuthContext: Logout function called.');
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    queryClient.clear(); // Clear all queries on logout
    window.location.href = '/login'; // Redirect to login page
  };

  // Check if authenticated (token exists and not expired)
  const isAuthenticated: boolean = !!token && !!user && (!user.exp || user.exp * 1000 > Date.now());

  console.log(
    `AuthContext: Render. isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, token: ${!!token}`,
  );

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, isLoading }}>
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
