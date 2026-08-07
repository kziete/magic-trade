"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, useLazyGetMeQuery } from "./authApi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
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
    console.log("[DEBUG mount effect] token present:", !!token);
    if (token) {
      getMe()
        .unwrap()
        .then((userData) => {
          console.log("[DEBUG mount effect] getMe resolved", userData);
          setUser(userData);
        })
        .catch((err) => {
          console.log("[DEBUG mount effect] getMe rejected", err);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        })
        .finally(() => {
          console.log("[DEBUG mount effect] setIsLoading(false)");
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [getMe]);

  const login = async (token: string) => {
    localStorage.setItem("token", token);
    const userData = await getMe().unwrap();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
