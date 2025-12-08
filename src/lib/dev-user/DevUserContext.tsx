"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type DevUserType = "seller" | "buyer";

type DevUserContextValue = {
  current: DevUserType;
  setCurrent: (userType: DevUserType) => void;
};

const DevUserContext = createContext<DevUserContextValue>({
  current: "seller",
  setCurrent: () => {},
});

const STORAGE_KEY = "dev_user_type";

export function DevUserProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrentState] = useState<DevUserType>("seller");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "seller" || saved === "buyer") {
      setCurrentState(saved);
    }
  }, []);

  const setCurrent = (userType: DevUserType) => {
    setCurrentState(userType);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, userType);
    }
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
