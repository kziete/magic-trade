"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, useLazyGetMeQuery } from "./authApi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  // Read synchronously (not React state) so a protected page's "no user ->
  // redirect to login" guard can tell an intentional logout apart from a
  // real session expiry in the same render pass that observes user turning
  // null, without waiting on another re-render.
  isLoggingOut: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  isLoggingOut: () => false,
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
  const isLoggingOutRef = useRef(false);

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
          localStorage.removeItem("refreshToken");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [getMe]);

  const login = async (token: string) => {
    // A fresh login is the clear signal we're no longer in the "just logged
    // out" window, so future session expiries go back to redirecting normally.
    isLoggingOutRef.current = false;
    localStorage.setItem("token", token);
    const userData = await getMe().unwrap();
    setUser(userData);
  };

  const logout = () => {
    // Set before setUser(null): protected pages still mounted at the moment
    // of logout have a `user`-dependent effect that redirects to /login when
    // there's no user, which would otherwise race the intentional navigation
    // to home and win it (statement order alone doesn't prevent this, since
    // router.push/replace doesn't synchronously unmount the outgoing page).
    isLoggingOutRef.current = true;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isLoggingOut: () => isLoggingOutRef.current }}
    >
      {children}
    </AuthContext.Provider>
  );
}
