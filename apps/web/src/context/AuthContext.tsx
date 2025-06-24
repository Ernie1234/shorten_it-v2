import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { JwtPayload } from "@repo/types";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt_token");
    if (storedToken) {
      try {
        const decodedUser = jwtDecode<JwtPayload>(storedToken);
        // Check if token is expired
        if (decodedUser.exp && decodedUser.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(decodedUser);
        } else {
          localStorage.removeItem("jwt_token");
        }
      } catch (e) {
        console.error("Failed to decode token:", e);
        localStorage.removeItem("jwt_token");
      }
    }

    // Handle Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get("token");
    if (googleToken) {
      login(googleToken);
      // Clean URL
      urlParams.delete("token");
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + urlParams.toString(),
      );
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken);
    setToken(newToken);
    const decodedUser = jwtDecode<JwtPayload>(newToken);
    setUser(decodedUser);
    queryClient.invalidateQueries();
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
    setUser(null);
    queryClient.clear();
    window.location.href = "/login";
  };

  // Check if authenticated (token exists and not expired)
  const isAuthenticated: boolean =
    !!token && !!user && (!user.exp || user.exp * 1000 > Date.now()); // Simplified condition

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
