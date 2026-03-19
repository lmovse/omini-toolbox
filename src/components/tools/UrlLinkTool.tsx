import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  Link,
  Plus,
  Trash2,
  ArrowRight,
  Copy,
  Check,
  Upload,
  X,
  Download,
} from "lucide-react";

interface ShortLinkItem {
  path: string;
  query: string;
}

interface UrlLinkResult {
  path: string;
  query: string;
  link: string;
  err_msg: string;
}

interface MiniAppConfig {
  id: string;
  name: string;
  appid: string;
  secret: string;
  created_at: number;
}

interface AppSettings {
  mini_apps: MiniAppConfig[];
  default_app_id: string | null;
  theme: "light" | "dark" | "system" | null;
}

interface UrlLinkToolProps {
  selectedAppId: string;
  settings: AppSettings;
  onSelectApp: (id: string) => void;
  urlLinkResults: UrlLinkResult[];
  setUrlLinkResults: (results: UrlLinkResult[]) => void;
}

export function UrlLinkTool({ selectedAppId, settings, onSelectApp, urlLinkResults, setUrlLinkResults }: UrlLinkToolProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShortLinkItem[]>([{ path: "", query: "" }]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [envVersion, setEnvVersion] = useState("release");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const selectedApp = settings.mini_apps.find((app) => app.id === selectedAppId);

  useEffect(() => {
    if (exportMessage) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exportMessage]);

  const addItem = () => {
    setItems([...items, { path: "", query: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ShortLinkItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleImport = () => {
    const lines = importText.trim().split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      return;
    }

    const parsedItems: ShortLinkItem[] = lines.map((line) => {
      const trimmedLine = line.trim();
      try {
        const url = new URL(trimmedLine.startsWith("http") ? trimmedLine : `http://example.com${trimmedLine}`);
        const path = url.pathname;
        const query = url.search.slice(1);
        return { path, query };
      } catch {
        const [pathPart, queryPart] = trimmedLine.split("?");
        return { path: pathPart || "", query: queryPart || "" };
      }
    });

    if (parsedItems.length > 0) {
      setItems(parsedItems);
    }
    setShowImportModal(false);
    setImportText("");
  };

  const generateUrlLinks = async () => {
    if (!selectedApp) {
      alert(t("urlLinkTool.selectMiniProgram"));
      return;
    }

    const validItems = items.filter((item) => item.path.trim() !== "");
    if (validItems.length === 0) {
      alert(t("urlLinkTool.fillAtLeastOnePath"));
      return;
    }

    setLoading(true);
    try {
      const results = await invoke<UrlLinkResult[]>("generate_wechat_urllinks", {
        appid: selectedApp.appid,
        secret: selectedApp.secret,
        envVersion,
        items: validItems,
      });
      setUrlLinkResults(results);
    } catch (error) {
      console.error(t("urlLinkTool.generateFailed"), error);
      alert(`${t("urlLinkTool.generateFailed")}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllLinks = () => {
    const allLinks = urlLinkResults.filter((r) => r.link).map((r) => r.link).join("\n");
    if (allLinks) {
      navigator.clipboard.writeText(allLinks);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportCsv = () => {
    const validResults = urlLinkResults.filter((r) => r.link);
    if (validResults.length === 0) {
      return;
    }

    const csvContent = [
      ["Original URL", "Generated Link"],
      ...validResults.map((r) => [
        `${r.path}${r.query ? `?${r.query}` : ""}`,
        r.link,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const fileName = `urllinks_${Date.now()}.csv`;

    try {
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage(`Downloads/${fileName}`);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 bg-background border border-border px-4 py-3 rounded-2xl shadow-xl text-sm z-50 max-w-md transition-opacity duration-200"
        style={{ opacity: showToast ? 1 : 0, pointerEvents: showToast ? "auto" : "none" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{t("urlLinkTool.exportSuccess")}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">{exportMessage}</div>
          </div>
        </div>
      </div>
      <div className="bento-card">
        <div className="bento-card-header">
          <div className="tool-icon bg-green-500/10 text-green-600">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h3 className="bento-card-title">{t("urlLinkTool.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("urlLinkTool.generateUrlLinkDesc")}</p>
          </div>
        </div>

        <div className="bento-card-content space-y-4">
          {/* App Selection */}
          <div className="space-y-2">
            <label className="label">{t("urlLinkTool.selectConfig")}</label>
            <select
              value={selectedAppId}
              onChange={(e) => onSelectApp(e.target.value)}
              className="input"
            >
              <option value="">{t("urlLinkTool.selectMiniProgram")}...</option>
              {settings.mini_apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} {settings.default_app_id === app.id ? "(Default)" : ""}
                </option>
              ))}
            </select>
            {selectedApp && (
              <div className="text-xs text-muted-foreground">
                {t("settings.appId")}: {selectedApp.appid}
              </div>
            )}
          </div>

          {/* Env Version */}
          <div className="space-y-2">
            <label className="label">{t("urlLinkTool.version")}</label>
            <select
              value={envVersion}
              onChange={(e) => setEnvVersion(e.target.value)}
              className="input"
            >
              <option value="release">Release</option>
              <option value="develop">Develop</option>
              <option value="trial">Trial</option>
            </select>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label">{t("urlLinkTool.pathAndParams")}</label>
              <div className="flex gap-2">
                <button onClick={() => setShowImportModal(true)} className="button-ghost text-xs">
                  <Upload className="w-4 h-4 mr-1" />
                  {t("urlLinkTool.import")}
                </button>
                <button onClick={addItem} className="button-ghost text-xs">
                  <Plus className="w-4 h-4 mr-1" />
                  {t("urlLinkTool.add")}
                </button>
              </div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="input"
                    placeholder={t("urlLinkTool.pathPlaceholder")}
                    value={item.path}
                    onChange={(e) => updateItem(index, "path", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder={t("urlLinkTool.queryPlaceholder")}
                    value={item.query}
                    onChange={(e) => updateItem(index, "query", e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="button-ghost text-destructive hover:bg-destructive/10"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={generateUrlLinks}
              disabled={loading || !selectedAppId}
              className="button-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("urlLinkTool.generating")}...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t("urlLinkTool.generate")}
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {urlLinkResults.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <label className="label">{t("urlLinkTool.generatedLink")}</label>
                <div className="flex gap-2">
                  <button onClick={copyAllLinks} className="button-ghost button-sm">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t("urlLinkTool.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        {t("urlLinkTool.copyAll")}
                      </>
                    )}
                  </button>
                  <button type="button" onClick={exportCsv} className="button-ghost button-sm">
                    <Download className="w-4 h-4 mr-1" />
                    {t("urlLinkTool.exportCsv")}
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {urlLinkResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      result.link ? "bg-muted/50" : "bg-destructive/10"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">
                        {result.path ? `${result.path}` : "/"}
                        {result.query && `?${result.query}`}
                      </div>
                      {result.link ? (
                        <div className="text-sm font-medium text-primary truncate">
                          {result.link}
                        </div>
                      ) : (
                        <div className="text-sm text-destructive">
                          {t("urlLinkTool.failed")}: {result.err_msg}
                        </div>
                      )}
                    </div>
                    {result.link && (
                      <button
                        onClick={() => copyToClipboard(result.link)}
                        className="button-ghost p-2"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t("urlLinkTool.importTitle")}</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText("");
                  }}
                  className="button-ghost p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("urlLinkTool.importDesc")}</p>
              <textarea
                className="input min-h-[200px] font-mono text-sm"
                placeholder={t("urlLinkTool.importPlaceholder")}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText("");
                  }}
                  className="button-ghost button-sm"
                >
                  {t("settings.cancel")}
                </button>
                <button onClick={handleImport} className="button-primary button-sm">
                  {t("urlLinkTool.import")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
