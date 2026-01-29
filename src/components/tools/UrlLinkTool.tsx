import { useState } from "react";
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
}

export function UrlLinkTool({ selectedAppId, settings, onSelectApp }: UrlLinkToolProps) {
  const [items, setItems] = useState<ShortLinkItem[]>([{ path: "", query: "" }]);
  const [results, setResults] = useState<UrlLinkResult[]>([]);
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
      alert("请选择一个小程序");
      return;
    }

    const validItems = items.filter((item) => item.path.trim() !== "");
    if (validItems.length === 0) {
      alert("请至少填写一个路径");
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
      setResults(results);
    } catch (error) {
      console.error("生成 URL Link 失败:", error);
      alert(`生成失败: ${error}`);
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
    const allLinks = results.filter((r) => r.link).map((r) => r.link).join("\n");
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
            <h3 className="bento-card-title">URL Link 生成</h3>
            <p className="text-xs text-muted-foreground">生成微信小程序 URL Link</p>
          </div>
        </div>

        <div className="bento-card-content space-y-4">
          {/* App Selection */}
          <div className="space-y-2">
            <label className="label">选择小程序</label>
            <select
              value={selectedAppId}
              onChange={(e) => onSelectApp(e.target.value)}
              className="input"
            >
              <option value="">请选择小程序...</option>
              {settings.mini_apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} {settings.default_app_id === app.id ? "(默认)" : ""}
                </option>
              ))}
            </select>
            {selectedApp && (
              <div className="text-xs text-muted-foreground">
                AppID: {selectedApp.appid}
              </div>
            )}
          </div>

          {/* Env Version */}
          <div className="space-y-2">
            <label className="label">版本</label>
            <select
              value={envVersion}
              onChange={(e) => setEnvVersion(e.target.value)}
              className="input"
            >
              <option value="release">正式版 (release)</option>
              <option value="develop">开发版 (develop)</option>
              <option value="trial">体验版 (trial)</option>
            </select>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label">路径与参数配置</label>
              <button onClick={addItem} className="button-ghost text-xs">
                <Plus className="w-4 h-4 mr-1" />
                添加
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="路径 (例如: pages/index)"
                    value={item.path}
                    onChange={(e) => updateItem(index, "path", e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="查询参数 (例如: id=123)"
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
                  生成中...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  生成 URL Link
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <label className="label">生成结果</label>
                <button onClick={copyAllLinks} className="button-ghost text-xs">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      复制全部
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
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
                          失败: {result.err_msg}
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
