import React, { createContext, useContext, useState, ReactNode } from "react";
import { PackageManager } from "../types";

interface DocsContextValue {
  packageManager: PackageManager;
  setPackageManager: (pm: PackageManager) => void;
  activeArticleId: string;
  setActiveArticleId: (id: string) => void;
  isTryInModalOpen: boolean;
  setIsTryInModalOpen: (open: boolean) => void;
}

const DocsContext = createContext<DocsContextValue | null>(null);

export const DocsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [packageManager, setPackageManager] = useState<PackageManager>("bun");
  const [activeArticleId, setActiveArticleId] = useState<string>("introduction");
  const [isTryInModalOpen, setIsTryInModalOpen] = useState<boolean>(false);

  return (
    <DocsContext.Provider
      value={{
        packageManager,
        setPackageManager,
        activeArticleId,
        setActiveArticleId,
        isTryInModalOpen,
        setIsTryInModalOpen
      }}
    >
      {children}
    </DocsContext.Provider>
  );
};

export function useDocs(): DocsContextValue {
  const context = useContext(DocsContext);
  if (!context) throw new Error("useDocs must be used within DocsProvider");
  return context;
}
