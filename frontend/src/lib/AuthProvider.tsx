"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, useLazyGetMeQuery } from "./authApi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .unwrap()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [getMe]);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    getMe()
      .unwrap()
      .then((userData) => {
        setUser(userData);
      });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
