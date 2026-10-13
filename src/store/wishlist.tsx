import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { mergeWishlistFn, setWishlistItemFn } from "@/lib/account-functions";
import { useAccount } from "./account";

const WISHLIST_KEY = "noir-atelier.wishlist.v1";

type WishlistContextValue = {
  ids: string[];
  hydrated: boolean;
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const userId = account.user?.id;
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [idsOwner, setIdsOwner] = useState("guest");

  useEffect(() => {
    setIds(readWishlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !account.hydrated || account.user || idsOwner !== "guest") return;
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable — wishlist stays in memory
    }
  }, [ids, hydrated, account.hydrated, account.user, idsOwner]);

  useEffect(() => {
    if (!hydrated || !account.hydrated) return;
    if (!userId) {
      setIds(readWishlist());
      setIdsOwner("guest");
      return;
    }
    let active = true;
    mergeWishlistFn({ data: { ids: readWishlist().filter((id) => /^[0-9a-f-]{36}$/i.test(id)) } })
      .then((serverIds) => {
        if (!active) return;
        setIds(serverIds);
        setIdsOwner(userId);
        window.localStorage.removeItem(WISHLIST_KEY);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId, account.hydrated, hydrated]);

  const update = useCallback(
    (id: string, saved: boolean) => {
      setIds((prev) =>
        saved ? (prev.includes(id) ? prev : [id, ...prev]) : prev.filter((item) => item !== id),
      );
      if (account.user)
        void setWishlistItemFn({ data: { productId: id, saved } }).catch(() => {
          setIds((prev) => (saved ? prev.filter((item) => item !== id) : [id, ...prev]));
        });
    },
    [account.user],
  );

  const toggle = useCallback(
    (id: string) => {
      update(id, !ids.includes(id));
    },
    [ids, update],
  );

  const remove = useCallback(
    (id: string) => {
      update(id, false);
    },
    [update],
  );

  const clear = useCallback(() => {
    const oldIds = ids;
    setIds([]);
    if (account.user)
      void Promise.all(
        oldIds.map((id) => setWishlistItemFn({ data: { productId: id, saved: false } })),
      );
  }, [account.user, ids]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      hydrated,
      count: ids.length,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
    }),
    [ids, hydrated, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
