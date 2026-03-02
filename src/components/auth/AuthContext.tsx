"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { isAuthorizedDomain } from "@/lib/auth";

interface User {
  email: string;
  name: string;
  picture?: string;
  isManager: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (credential: string) => void;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ghostbond_auth");
    if (token) {
      handleToken(token);
    }
    setIsReady(true);
  }, []);

  const handleToken = async (token: string) => {
    try {
      const decoded = jwtDecode<any>(token);
      if (isAuthorizedDomain(decoded.email)) {
        
        // Fetch isManager securely from the server
        const res = await fetch(`/api/auth/me?email=${encodeURIComponent(decoded.email)}`);
        const data = await res.json();
        const isManagerFlag = data.isManager || false;

        setUser({
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          isManager: isManagerFlag,
        });
        localStorage.setItem("ghostbond_auth", token);
      } else {
        alert("Unauthorized domain. Please use a @prohairlabs.com or @ghostbond.com email.");
        logout();
      }
    } catch (e) {
      console.error(e);
      logout();
    }
  };

  const login = (credential: string) => {
    handleToken(credential);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ghostbond_auth");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
