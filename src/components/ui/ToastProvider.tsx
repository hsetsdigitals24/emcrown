// Client notification host: reusable, bounded floating messages with accessible dismissal.
"use client";
import { createContext, useCallback, useContext, useState } from "react";
import Toast from "@/components/ui/Toast";
type Notice = { id: number; message: string; success: boolean };
type Notify = (message: string, success?: boolean) => void;
const ToastContext = createContext<Notify>(() => undefined);
let nextId = 0;
export function useToast() { return useContext(ToastContext); }
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const dismiss = useCallback((id: number) => setNotices(items => items.filter(item => item.id !== id)), []);
  const notify = useCallback<Notify>((message, success = false) => {
    const id = ++nextId;
    // Replace repeated autosave messages instead of accumulating announcements.
    setNotices(items => [...items.filter(item => item.message !== message).slice(-2), { id, message, success }]);
  }, []);
  return <ToastContext value={notify}>{children}<div className="toast-stack">
    {notices.map(item => <Toast key={item.id} message={item.message} success={item.success}
      onDismiss={() => dismiss(item.id)} />)}
  </div></ToastContext>;
}
