import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Link,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  Settings,
  Edit,
  Star,
  StarOff,
  Home,
  QrCode,
  Hash,
  Clock,
  Database,
  Palette,
  Globe,
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
}

type SettingsSection = "general" | "wechat" | "about";

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "settings">("home");
  const [activeTool, setActiveTool] = useState<string>("urllink");
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [items, setItems] = useState<ShortLinkItem[]>([{ path: "", query: "" }]);
  const [results, setResults] = useState<UrlLinkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [envVersion, setEnvVersion] = useState("release");
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("wechat");

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    mini_apps: [],
    default_app_id: null,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<MiniAppConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    appid: "",
    secret: "",
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await invoke<AppSettings>("load_settings");
      setSettings(loaded);
      if (loaded.default_app_id) {
        setSelectedAppId(loaded.default_app_id);
      }
    } catch (error) {
      console.error("加载设置失败:", error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await invoke("save_settings", { settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error("保存设置失败:", error);
      alert("保存设置失败");
    }
  };

  const addApp = async () => {
    if (!formData.name.trim() || !formData.appid.trim() || !formData.secret.trim()) {
      alert("请填写完整信息");
      return;
    }

    const newApp: MiniAppConfig = {
      id: crypto.randomUUID(),
      name: formData.name,
      appid: formData.appid,
      secret: formData.secret,
      created_at: Date.now(),
    };

    const newSettings: AppSettings = {
      ...settings,
      mini_apps: [...settings.mini_apps, newApp],
      default_app_id: settings.default_app_id || newApp.id,
    };

    await saveSettings(newSettings);
    setFormData({ name: "", appid: "", secret: "" });
    setShowAddForm(false);
  };

  const updateApp = async () => {
    if (!editingApp) return;
    if (!formData.name.trim() || !formData.appid.trim() || !formData.secret.trim()) {
      alert("请填写完整信息");
      return;
    }

    const newSettings: AppSettings = {
      ...settings,
      mini_apps: settings.mini_apps.map((app) =>
        app.id === editingApp.id
          ? { ...app, name: formData.name, appid: formData.appid, secret: formData.secret }
          : app
      ),
    };

    await saveSettings(newSettings);
    setEditingApp(null);
    setFormData({ name: "", appid: "", secret: "" });
  };

  const deleteApp = async (id: string) => {
    if (!confirm("确定要删除这个小程序配置吗？")) return;

    const newSettings: AppSettings = {
      ...settings,
      mini_apps: settings.mini_apps.filter((app) => app.id !== id),
      default_app_id: settings.default_app_id === id ? null : settings.default_app_id,
    };

    await saveSettings(newSettings);
    if (selectedAppId === id) {
      setSelectedAppId("");
    }
  };

  const setDefaultApp = async (id: string) => {
    const newSettings: AppSettings = {
      ...settings,
      default_app_id: id,
    };
    await saveSettings(newSettings);
    setSelectedAppId(id);
  };

  const startEdit = (app: MiniAppConfig) => {
    setEditingApp(app);
    setFormData({ name: app.name, appid: app.appid, secret: app.secret });
  };

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

  const tools = [
    {
      id: "urllink",
      name: "URL Link",
      icon: () => <Link className="w-5 h-5" />,
      color: "bg-green-500/10 text-green-600",
      comingSoon: false,
    },
    {
      id: "qrcode",
      name: "二维码",
      icon: () => <QrCode className="w-5 h-5" />,
      color: "bg-blue-500/10 text-blue-600",
      comingSoon: true,
    },
    {
      id: "url-encoder",
      name: "URL 编码",
      icon: () => <Hash className="w-5 h-5" />,
      color: "bg-purple-500/10 text-purple-600",
      comingSoon: true,
    },
    {
      id: "timestamp",
      name: "时间戳",
      icon: () => <Clock className="w-5 h-5" />,
      color: "bg-orange-500/10 text-orange-600",
      comingSoon: true,
    },
  ];

  const settingsSections = [
    { id: "general" as const, name: "通用", icon: () => <Settings className="w-5 h-5" /> },
    { id: "wechat" as const, name: "微信相关", icon: () => <Globe className="w-5 h-5" /> },
    { id: "about" as const, name: "关于", icon: () => <Home className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TT</span>
            </div>
            <h1 className="text-lg font-semibold">Tata ToolBox</h1>
          </div>
          <button
            onClick={() => setCurrentPage("settings")}
            className="button-ghost"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 pt-14 flex">
        {/* Left Toolbar Hotbar */}
        <aside className="fixed left-0 top-14 bottom-0 w-16 border-r bg-background/95 flex flex-col items-center py-4 gap-2 z-40">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => !tool.comingSoon && setActiveTool(tool.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTool === tool.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              } ${tool.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              title={tool.name}
            >
              <tool.icon />
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-16 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Home Page */}
            {currentPage === "home" && (
              <div className="space-y-6">
                {/* Active Tool Panel */}
                {activeTool === "urllink" && (
                  <section>
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
                            onChange={(e) => setSelectedAppId(e.target.value)}
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
                                      {result.path ? `/${result.path}` : "/"}
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
                  </section>
                )}

                {/* Coming Soon Tool */}
                {activeTool !== "urllink" && (
                  <section>
                    <div className="bento-card">
                      <div className="bento-card-content text-center py-12">
                        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                          <span className="text-2xl">🚧</span>
                        </div>
                        <h3 className="text-lg font-medium mb-2">即将推出</h3>
                        <p className="text-muted-foreground">
                          这个工具正在开发中，敬请期待...
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Settings Page */}
            {currentPage === "settings" && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={() => setCurrentPage("home")}
                  className="button-ghost text-sm mb-2"
                >
                  <Home className="w-4 h-4 mr-1" />
                  返回首页
                </button>

                {/* Settings Header */}
                <div className="pb-4 border-b">
                  <h2 className="text-xl font-semibold">设置</h2>
                  <p className="text-sm text-muted-foreground">配置应用选项</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  {/* Settings Navigation */}
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSettingsSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSettingsSection === section.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <section.icon />
                        {section.name}
                      </button>
                    ))}
                  </nav>

                  {/* Settings Content */}
                  <div className="space-y-6">
                    {/* General Section */}
                    {activeSettingsSection === "general" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="tool-icon bg-blue-500/10 text-blue-600">
                            <Palette className="w-5 h-5" />
                          </div>
                          <h3 className="font-medium">外观</h3>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                          外观设置功能开发中...
                        </div>
                      </div>
                    )}

                    {/* WeChat Section */}
                    {activeSettingsSection === "wechat" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="tool-icon bg-green-500/10 text-green-600">
                            <Database className="w-5 h-5" />
                          </div>
                          <h3 className="font-medium">小程序配置</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          配置微信小程序 API 凭证，用于 URL Link 生成等工具
                        </p>

                        {/* App List */}
                        {settings.mini_apps.length > 0 && (
                          <div className="space-y-2">
                            <label className="label">已配置的小程序</label>
                            <div className="space-y-2">
                              {settings.mini_apps.map((app) => (
                                <div
                                  key={app.id}
                                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                                    selectedAppId === app.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedAppId(app.id);
                                      setActiveTool("urllink");
                                      setCurrentPage("home");
                                    }}
                                    className="flex-1 text-left"
                                  >
                                    <div className="font-medium">{app.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {app.appid}
                                    </div>
                                  </button>
                                  <button
                                    onClick={() =>
                                      settings.default_app_id === app.id
                                        ? setDefaultApp("")
                                        : setDefaultApp(app.id)
                                    }
                                    className="button-ghost p-2"
                                    title={settings.default_app_id === app.id ? "取消默认" : "设为默认"}
                                  >
                                    {settings.default_app_id === app.id ? (
                                      <Star className="w-4 h-4 text-yellow-500" />
                                    ) : (
                                      <StarOff className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => startEdit(app)}
                                    className="button-ghost p-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteApp(app.id)}
                                    className="button-ghost p-2 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add/Edit Form */}
                        {(showAddForm || editingApp) && (
                          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <h4 className="font-medium">
                              {editingApp ? "编辑小程序" : "添加小程序"}
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <label className="label">名称 *</label>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="例如：我的小程序"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="label">AppID *</label>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="例如：wx1234567890"
                                  value={formData.appid}
                                  onChange={(e) =>
                                    setFormData({ ...formData, appid: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <label className="label">AppSecret *</label>
                                <input
                                  type="password"
                                  className="input"
                                  placeholder="在微信后台获取的 AppSecret"
                                  value={formData.secret}
                                  onChange={(e) =>
                                    setFormData({ ...formData, secret: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={editingApp ? updateApp : addApp}
                                className="button-primary"
                              >
                                {editingApp ? "保存修改" : "添加"}
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddForm(false);
                                  setEditingApp(null);
                                  setFormData({ name: "", appid: "", secret: "" });
                                }}
                                className="button-secondary"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Add Button */}
                        {!showAddForm && !editingApp && (
                          <button
                            onClick={() => setShowAddForm(true)}
                            className="button-primary w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            添加小程序
                          </button>
                        )}

                        {/* Empty State */}
                        {settings.mini_apps.length === 0 && !showAddForm && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>还没有配置小程序</p>
                            <p className="text-sm">点击上方按钮添加你的第一个小程序</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* About Section */}
                    {activeSettingsSection === "about" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold">TT</span>
                          </div>
                          <div>
                            <h3 className="font-medium">Tata ToolBox</h3>
                            <p className="text-sm text-muted-foreground">版本 0.1.0</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          一个实用的工具箱应用，支持多种常用工具的快捷生成。
                        </p>
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Built with React + Tauri
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
