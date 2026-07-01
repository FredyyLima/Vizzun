import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiPath } from "@/lib/api";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string;
  role?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(apiPath("/api/me"), { credentials: "include" });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        personType: data.personType,
        tradeName: data.tradeName,
        companyName: data.companyName,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch(apiPath("/api/logout"), { method: "POST", credentials: "include" });
    } catch {
      // cookie pode ja ter expirado no servidor; segue limpando o estado local
    }
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
};
