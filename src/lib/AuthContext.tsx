import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export interface AuthCtx { user: User; isAdmin: boolean }

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthGate>");
  return ctx;
}
