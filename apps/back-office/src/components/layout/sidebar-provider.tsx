'use client';

import React, { createContext, useContext } from 'react';

import { useBoolean } from '@verone/hooks';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const sidebar = useBoolean(true);

  const toggle = sidebar.toggle;
  const close = sidebar.setFalse;
  const open = sidebar.setTrue;

  return (
    <SidebarContext.Provider
      value={{
        isOpen: sidebar.value,
        toggle,
        close,
        open,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
