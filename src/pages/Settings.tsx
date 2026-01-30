import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Languages,
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
  language: string | null;
}

interface SettingsProps {
  settings: AppSettings;
  theme: "light" | "dark" | "system";
  activeSettingsSection: string;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateTheme: (theme: "light" | "dark" | "system") => void;
  onUpdateLanguage: (lng: string) => void;
  currentLanguage: string;
  onSetActiveSection: (section: string) => void;
  onGoHome: () => void;
  onSelectApp: (id: string) => void;
}

type SettingsSection = "general" | "wechat" | "about";

const settingsSections = [
  { id: "general" as SettingsSection, name: "settings.general", icon: () => <SettingsIcon className="w-5 h-5" /> },
  { id: "wechat" as SettingsSection, name: "settings.wechat", icon: () => <Globe className="w-5 h-5" /> },
  { id: "about" as SettingsSection, name: "settings.about", icon: () => <Home className="w-5 h-5" /> },
];

export function Settings({
  settings,
  theme,
  activeSettingsSection,
  onUpdateSettings,
  onUpdateTheme,
  onUpdateLanguage,
  currentLanguage,
  onSetActiveSection,
  onGoHome,
  onSelectApp,
}: SettingsProps) {
  const { t } = useTranslation();
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
        {t("nav.home")}
      </button>

      {/* Settings Header */}
      <div className="pb-4 border-b">
        <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.configureAppOptions")}</p>
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
              <span>{t(section.name)}</span>
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
                <h3 className="font-medium">{t("settings.general")}</h3>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <label className="label">{t("settings.theme")}</label>
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
                    <div className="text-sm font-medium">{t("settings.themeLight")}</div>
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
                    <div className="text-sm font-medium">{t("settings.themeDark")}</div>
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
                    <div className="text-sm font-medium">{t("settings.themeSystem")}</div>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-muted-foreground" />
                  <label className="label">{t("settings.language")}</label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => onUpdateLanguage("en")}
                    className={`p-4 rounded-lg border transition-all text-foreground ${
                      currentLanguage === "en"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{t("settings.languageEn")}</div>
                  </button>
                  <button
                    onClick={() => onUpdateLanguage("zh-CN")}
                    className={`p-4 rounded-lg border transition-all text-foreground ${
                      currentLanguage === "zh-CN"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{t("settings.languageZh")}</div>
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
                <h3 className="font-medium">{t("settings.miniProgramConfig")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("settings.wechatApiDesc")}
              </p>

              {/* App List */}
              {settings.mini_apps.length > 0 && (
                <div className="space-y-2">
                  <label className="label">{t("settings.configuredMiniPrograms")}</label>
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
                          title={settings.default_app_id === app.id ? t("settings.cancelDefault") : t("settings.setAsDefault")}
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
                    {editingApp ? t("urlLinkTool.editMiniApp") : t("settings.addConfig")}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="label">{t("urlLinkTool.name")} *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="My Mini Program"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">{t("settings.appId")} *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="wx1234567890"
                        value={formData.appid}
                        onChange={(e) =>
                          setFormData({ ...formData, appid: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="label">{t("settings.appSecret")} *</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="AppSecret from WeChat Admin"
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
                      {editingApp ? t("settings.save") : t("settings.addConfig")}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingApp(null);
                        setFormData({ name: "", appid: "", secret: "" });
                      }}
                      className="button-secondary"
                    >
                      {t("settings.cancel")}
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
                  {t("settings.addConfig")}
                </button>
              )}

              {/* Empty State */}
              {settings.mini_apps.length === 0 && !showAddForm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("settings.noMiniPrograms")}</p>
                  <p className="text-sm">{t("settings.addFirstMiniProgram")}</p>
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
                  <p className="text-sm text-muted-foreground">{t("settings.version")} 0.1.0</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("settings.aboutDesc")}
              </p>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {t("settings.builtWithReactTauri")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
