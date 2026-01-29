import { useState } from "react";
import {
  Settings as SettingsIcon,
  Globe,
  Home,
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  Database,
  Palette,
} from "lucide-react";

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

interface SettingsProps {
  settings: AppSettings;
  theme: "light" | "dark" | "system";
  activeSettingsSection: string;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateTheme: (theme: "light" | "dark" | "system") => void;
  onSetActiveSection: (section: string) => void;
  onGoHome: () => void;
  onSelectApp: (id: string) => void;
}

type SettingsSection = "general" | "wechat" | "about";

const settingsSections = [
  { id: "general" as SettingsSection, name: "通用", icon: () => <SettingsIcon className="w-5 h-5" /> },
  { id: "wechat" as SettingsSection, name: "微信相关", icon: () => <Globe className="w-5 h-5" /> },
  { id: "about" as SettingsSection, name: "关于", icon: () => <Home className="w-5 h-5" /> },
];

export function Settings({
  settings,
  theme,
  activeSettingsSection,
  onUpdateSettings,
  onUpdateTheme,
  onSetActiveSection,
  onGoHome,
  onSelectApp,
}: SettingsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<MiniAppConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    appid: "",
    secret: "",
  });

  const addApp = () => {
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

    onUpdateSettings(newSettings);
    setFormData({ name: "", appid: "", secret: "" });
    setShowAddForm(false);
  };

  const updateApp = () => {
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

    onUpdateSettings(newSettings);
    setEditingApp(null);
    setFormData({ name: "", appid: "", secret: "" });
  };

  const deleteApp = (id: string) => {
    if (!confirm("确定要删除这个小程序配置吗？")) return;

    const newSettings: AppSettings = {
      ...settings,
      mini_apps: settings.mini_apps.filter((app) => app.id !== id),
      default_app_id: settings.default_app_id === id ? null : settings.default_app_id,
    };

    onUpdateSettings(newSettings);
  };

  const setDefaultApp = (id: string) => {
    const newSettings: AppSettings = {
      ...settings,
      default_app_id: id,
    };
    onUpdateSettings(newSettings);
  };

  const startEdit = (app: MiniAppConfig) => {
    setEditingApp(app);
    setFormData({ name: app.name, appid: app.appid, secret: app.secret });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={onGoHome} className="button-ghost text-sm mb-2">
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
        <nav id="settings-nav" className="space-y-1">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSetActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSettingsSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary hover:text-foreground"
              }`}
            >
              <section.icon />
              <span>{section.name}</span>
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

              <div className="space-y-3">
                <label className="label">主题</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => onUpdateTheme("light")}
                    className={`p-4 rounded-lg border transition-all text-foreground ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border shadow-sm mx-auto mb-2" />
                    <div className="text-sm font-medium">浅色</div>
                  </button>
                  <button
                    onClick={() => onUpdateTheme("dark")}
                    className={`p-4 rounded-lg border transition-all text-foreground ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-700 mx-auto mb-2" />
                    <div className="text-sm font-medium">深色</div>
                  </button>
                  <button
                    onClick={() => onUpdateTheme("system")}
                    className={`p-4 rounded-lg border transition-all text-foreground ${
                      theme === "system"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-white to-gray-900 border shadow-sm mx-auto mb-2" />
                    <div className="text-sm font-medium">跟随系统</div>
                  </button>
                </div>
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
                          settings.default_app_id === app.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectApp(app.id);
                            onGoHome();
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
                  <span className="text-primary-foreground font-bold">OT</span>
                </div>
                <div>
                  <h3 className="font-medium">Omini ToolBox</h3>
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
  );
}
