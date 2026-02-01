import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ErrorInfo {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  source: "frontend" | "backend";
  level: "error" | "warn" | "info";
}

// Error Context
interface ErrorContextType {
  errors: ErrorInfo[];
  addError: (error: Omit<ErrorInfo, "id" | "timestamp">) => void;
  clearErrors: () => void;
  sendErrorReport: (email: string) => Promise<void>;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}

// Error Provider
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((error: Omit<ErrorInfo, "id" | "timestamp">) => {
    const newError: ErrorInfo = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev, newError]);
    console.error("[Error]", newError);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const sendErrorReport = useCallback(async (email: string) => {
    try {
      await invoke("send_error_report", { email, errors });
    } catch (e) {
      console.error("Failed to send error report:", e);
      throw e;
    }
  }, [errors]);

  useEffect(() => {
    // Global error handlers
    const handleError = (event: ErrorEvent) => {
      addError({
        message: event.message,
        stack: event.error?.stack,
        source: "frontend",
        level: "error",
      });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      addError({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        source: "frontend",
        level: "error",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handlePromiseRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handlePromiseRejection);
    };
  }, [addError]);

  return (
    <ErrorContext.Provider value={{ errors, addError, clearErrors, sendErrorReport }}>
      {children}
    </ErrorContext.Provider>
  );
}
