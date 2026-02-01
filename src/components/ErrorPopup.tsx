import { useState } from "react";
import { useError } from "./ErrorBoundary";
import { X, Send, Trash2, AlertTriangle } from "lucide-react";

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ErrorPopup({ isOpen, onClose }: ErrorPopupProps) {
  const { errors, clearErrors, sendErrorReport } = useError();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setSendStatus("idle");
    try {
      await sendErrorReport(email);
      setSendStatus("success");
      setTimeout(() => {
        clearErrors();
        onClose();
        setSendStatus("idle");
        setEmail("");
      }, 2000);
    } catch (e) {
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-background rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold">错误报告</h2>
          </div>
          <button onClick={onClose} className="button-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Error List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">错误数量: {errors.length}</span>
              <button
                onClick={clearErrors}
                className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清除
              </button>
            </div>
            <div className="bg-muted rounded-lg p-3 max-h-48 overflow-auto space-y-2">
              {errors.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无错误</p>
              ) : (
                errors.map((error) => (
                  <div key={error.id} className="text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        error.level === "error" ? "bg-red-500/20 text-red-500" :
                        error.level === "warn" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-blue-500/20 text-blue-500"
                      }`}>
                        {error.source}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">{error.message}</p>
                    {error.stack && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-auto max-h-24">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Input */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">接收错误报告的邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="input"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {errors.length > 0 && (
          <div className="p-4 border-t space-y-2">
            {sendStatus === "success" && (
              <p className="text-sm text-green-500 text-center">发送成功！</p>
            )}
            {sendStatus === "error" && (
              <p className="text-sm text-red-500 text-center">发送失败，请重试</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 button-secondary"
                disabled={sending}
              >
                关闭
              </button>
              <button
                onClick={handleSend}
                className="flex-1 button-primary flex items-center justify-center gap-2"
                disabled={sending || !email.trim()}
              >
                {sending ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                发送报告
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to trigger error popup from anywhere
let triggerCallback: (() => void) | null = null;

export function setErrorPopupTrigger(callback: () => void) {
  triggerCallback = callback;
}

export function showErrorPopup() {
  triggerCallback?.();
}
