import { createContext, useContext, useState, useCallback } from "react";

export type AlertType = "launch" | "ravitaillement";

export interface QueueItem {
  id: string;
  type: AlertType;
}

interface ModalQueueValue {
  currentItem: QueueItem | null;
  enqueue: (item: QueueItem) => void;
  dismiss: (id: string) => void;
  isDismissed: (id: string) => boolean;
  clearDismissed: (id: string) => void;
  queueLength: number;
}

const ModalQueueContext = createContext<ModalQueueValue | null>(null);

const PRIORITY: Record<AlertType, number> = {
  launch: 0,
  ravitaillement: 1,
};

export function ModalQueueProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const enqueue = useCallback((item: QueueItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      const next = [...prev, item];
      next.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
      return next;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      next.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
      return next;
    });
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const clearDismissed = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isDismissed = useCallback(
    (id: string) => dismissedIds.has(id),
    [dismissedIds]
  );

  const currentItem = items.length > 0 ? items[0] : null;

  const value: ModalQueueValue = {
    currentItem,
    enqueue,
    dismiss,
    isDismissed,
    clearDismissed,
    queueLength: items.length,
  };

  return (
    <ModalQueueContext.Provider value={value}>
      {children}
    </ModalQueueContext.Provider>
  );
}

export function useModalQueue() {
  const context = useContext(ModalQueueContext);
  if (!context) {
    throw new Error("useModalQueue must be used within ModalQueueProvider");
  }
  return context;
}
