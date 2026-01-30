import { useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  Link,
  Plus,
  Trash2,
  ArrowRight,
  Copy,
  Check,
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

  const selectedApp = settings.mini_apps.find((app) => app.id === selectedAppId);

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

  return (
    <div className="space-y-6">
      <div className="bento-card">
        <div className="bento-card-header">
          <div className="tool-icon bg-green-500/10 text-green-600">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h3 className="bento-card-title">{t("urlLinkTool.title")}</h3>
            <p className="text-xs text-muted-foreground">Generate WeChat Mini Program URL Link</p>
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
              <button onClick={addItem} className="button-ghost text-xs">
                <Plus className="w-4 h-4 mr-1" />
                {t("urlLinkTool.add")}
              </button>
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
                <button onClick={copyAllLinks} className="button-ghost text-xs">
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
      </div>
    </div>
  );
}
