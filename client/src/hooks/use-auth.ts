import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "admin_token";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [location, setLocation] = useLocation();

  const setToken = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setLocation("/login");
  };

  useEffect(() => {
    // If we are not on login page and have no token, redirect
    if (!token && location !== "/login") {
      setLocation("/login");
    }
  }, [token, location, setLocation]);

  return { token, setToken, logout, isAuthenticated: !!token };
}
