"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEV_USERS, type DevUserKey } from "./users";

type DevUserType = DevUserKey;

type DevUserContextValue = {
  current: DevUserType;
  setCurrent: (userType: DevUserType) => void;
};

const DevUserContext = createContext<DevUserContextValue>({ current: "A", setCurrent: () => {} });

const STORAGE_KEY = "dev_user_type";
const DEV_USER_COOKIE_KEY = "dev_user_id";

const setDevUserCookie = (userType: DevUserType) => {
  if (typeof document === "undefined") return;
  document.cookie = `${DEV_USER_COOKIE_KEY}=${DEV_USERS[userType].id}; path=/; samesite=lax`;
};

export function DevUserProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrentState] = useState<DevUserType>("A");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved in DEV_USERS) {
      setCurrentState(saved as DevUserType);
      setDevUserCookie(saved as DevUserType);
      return;
    }
    setDevUserCookie("A");
  }, []);

  const setCurrent = (userType: DevUserType) => {
    setCurrentState(userType);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, userType);
    }
    setDevUserCookie(userType);
  };

  return (
    <DevUserContext.Provider value={{ current, setCurrent }}>
      {children}
    </DevUserContext.Provider>
  );
}

export function useDevUser() {
  return useContext(DevUserContext);
}

export function useCurrentDevUser() {
  const { current } = useDevUser();
  return DEV_USERS[current];
}
