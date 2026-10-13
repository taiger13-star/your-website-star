import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUserFn } from "@/lib/account-functions";

type User = Awaited<ReturnType<typeof getCurrentUserFn>>;
type AccountContextValue = {
  user: User;
  hydrated: boolean;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [hydrated, setHydrated] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setUser(await getCurrentUserFn());
    } catch {
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const value = useMemo(() => ({ user, hydrated, refresh, setUser }), [user, hydrated, refresh]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
