"use client";

import { createContext, useContext, useState } from "react";

type Ctx = { message: string; setMessage: (value: string) => void };

const MessageCtx = createContext<Ctx>({ message: "", setMessage: () => {} });

/** Holds the sender's personal message so the writing box and the share bar agree. */
export function MessageProvider({ initial, children }: { initial: string; children: React.ReactNode }) {
  const [message, setMessage] = useState(initial);
  return <MessageCtx.Provider value={{ message, setMessage }}>{children}</MessageCtx.Provider>;
}

export function useMessage() {
  return useContext(MessageCtx);
}
