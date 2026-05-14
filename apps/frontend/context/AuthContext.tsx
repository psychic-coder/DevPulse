import React, { createContext, useState, useEffect } from "react";

type User = { id: string; githubUsername: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Handle OAuth callback from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      setToken(token);
      // Decode JWT to get user info (simple parse, no verification)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userData = {
          id: payload.sub,
          githubUsername: payload.githubUsername,
        };
        localStorage.setItem("authUser", JSON.stringify(userData));
        setUser(userData);
        // Clean up URL
        window.history.replaceState({}, "", "/");
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
  }, []);

  const login = () => {
    window.location.href = "http://localhost:3000/auth/github";
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
