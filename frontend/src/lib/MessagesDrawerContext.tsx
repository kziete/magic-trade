"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface MessagesDrawerContextType {
  opened: boolean;
  conversationId: number | null;
  open: (conversationId?: number) => void;
  close: () => void;
  showList: () => void;
}

const MessagesDrawerContext = createContext<MessagesDrawerContextType>({
  opened: false,
  conversationId: null,
  open: () => {},
  close: () => {},
  showList: () => {},
});

export function useMessagesDrawer() {
  return useContext(MessagesDrawerContext);
}

export default function MessagesDrawerProvider({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const open = useCallback((id?: number) => {
    setConversationId(id ?? null);
    setOpened(true);
  }, []);

  const close = useCallback(() => setOpened(false), []);
  const showList = useCallback(() => setConversationId(null), []);

  return (
    <MessagesDrawerContext.Provider value={{ opened, conversationId, open, close, showList }}>
      {children}
    </MessagesDrawerContext.Provider>
  );
}
