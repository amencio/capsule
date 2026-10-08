import React, { createContext, useContext, useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "info" | "warning" | "success" | "danger";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  showHoustonToast: (title: string, description?: string, type?: ToastType) => void;
}

const HoustonToastContext = createContext<ToastContextValue | null>(null);

export function HoustonToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const showHoustonToast = useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, title, description, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-neon-green bg-neon-green/10";
      case "warning":
        return "border-neon-yellow bg-neon-yellow/10";
      case "danger":
        return "border-neon-red bg-neon-red/10";
      default:
        return "border-neon-cyan bg-neon-cyan/10";
    }
  };

  const getTitleColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "text-neon-green";
      case "warning":
        return "text-neon-yellow";
      case "danger":
        return "text-neon-red";
      default:
        return "text-neon-cyan";
    }
  };

  return (
    <HoustonToastContext.Provider value={{ showHoustonToast }}>
      {children}
      <View
        pointerEvents="box-none"
        style={{ top: insets.top + 12 }}
        className="absolute left-4 right-4 z-50 gap-2"
      >
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(250)}
            exiting={FadeOutUp.duration(200)}
          >
            <Pressable
              onPress={() => removeToast(toast.id)}
              className={`border rounded-2xl p-4 shadow-lg backdrop-blur-md bg-space-surface/95 ${getBorderColor(
                toast.type
              )}`}
            >
              <Text className={`font-bold text-sm ${getTitleColor(toast.type)}`}>
                {toast.title}
              </Text>
              {toast.description ? (
                <Text className="text-white/70 text-xs mt-0.5">
                  {toast.description}
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </HoustonToastContext.Provider>
  );
}

export function useHoustonToast() {
  const context = useContext(HoustonToastContext);
  if (!context) {
    throw new Error("useHoustonToast must be used within HoustonToastProvider");
  }
  return context;
}
