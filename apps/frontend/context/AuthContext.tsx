import React, { createContext, useState, useEffect } from "react";

type User = { id: string; githubUsername: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
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

  // Attempt a silent refresh on mount if no access token is present.
  // This allows restoring a session using the httpOnly refresh cookie after a full page reload.
  React.useEffect(() => {
    if (!token) {
      trySilentRefresh();
    }
    // only run once on mount or when token changes to null
  }, [token]);

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
    window.location.href = "/auth/github";
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
  };

  function parseJwtPayload(t: string | null) {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload as any;
    } catch (e) {
      return null;
    }
  }

  function isTokenExpiringSoon(t: string | null, bufferSeconds = 30) {
    const p = parseJwtPayload(t);
    if (!p || !p.exp) return true;
    const expMs = p.exp * 1000;
    return Date.now() + bufferSeconds * 1000 >= expMs;
  }

  async function refreshAccessToken() {
    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      if (data?.accessToken) {
        localStorage.setItem('authToken', data.accessToken);
        setToken(data.accessToken);
        // update user
        const payload = parseJwtPayload(data.accessToken);
        if (payload) {
          const userData = { id: payload.sub, githubUsername: payload.githubUsername };
          localStorage.setItem('authUser', JSON.stringify(userData));
          setUser(userData);
        }
        return data.accessToken as string;
      }
      throw new Error('no access token returned');
    } catch (e) {
      console.error('refreshAccessToken error', e);
      // do not force logout here; let callers decide how to handle failure
      throw e;
    }
  }

  // Try a silent refresh without forcing a logout on failure.
  async function trySilentRefresh(): Promise<string | null> {
    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.accessToken) {
        localStorage.setItem('authToken', data.accessToken);
        setToken(data.accessToken);
        const payload = parseJwtPayload(data.accessToken);
        if (payload) {
          const userData = { id: payload.sub, githubUsername: payload.githubUsername };
          localStorage.setItem('authUser', JSON.stringify(userData));
          setUser(userData);
        }
        return data.accessToken as string;
      }
      return null;
    } catch (e) {
      console.debug('silent refresh failed', e);
      return null;
    }
  }

  async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
    // ensure token present and not expiring
    let t = token;
    if (!t || isTokenExpiringSoon(t)) {
      try {
        t = await refreshAccessToken();
      } catch (e) {
        throw e;
      }
    }

    const headers = new Headers(init?.headers || {});
    if (t) headers.set('Authorization', `Bearer ${t}`);

    const res = await fetch(input, { ...init, headers, credentials: init?.credentials ?? 'include' });

    if (res.status === 401) {
      // try refresh once
      try {
        const newToken = await refreshAccessToken();
        const retryHeaders = new Headers(init?.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, { ...init, headers: retryHeaders, credentials: init?.credentials ?? 'include' });
      } catch (e) {
        throw e;
      }
    }

    return res;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchWithAuth }}>
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
