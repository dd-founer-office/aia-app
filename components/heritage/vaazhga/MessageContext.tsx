"use client";

import { createContext, useContext, useState } from "react";
import type { Sender } from "@/lib/heritage/vaazhga-senders";

type Ctx = {
  message: string;
  setMessage: (value: string) => void;
  senders: Sender[];
  setSenders: (value: Sender[]) => void;
};

const MessageCtx = createContext<Ctx>({ message: "", setMessage: () => {}, senders: [], setSenders: () => {} });

/**
 * Holds the personal message and who it is from, so the writing box, the
 * hero's envelope and the share bar all agree.
 */
export function MessageProvider({ initial, initialSenders, children }: { initial: string; initialSenders: Sender[]; children: React.ReactNode }) {
  const [message, setMessage] = useState(initial);
  const [senders, setSenders] = useState<Sender[]>(initialSenders);
  return <MessageCtx.Provider value={{ message, setMessage, senders, setSenders }}>{children}</MessageCtx.Provider>;
}

export function useMessage() {
  return useContext(MessageCtx);
}
