import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Settings as SettingsIcon } from "lucide-react";

import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import { tools } from "./components/ToolCard";

// 拖动处理函数
function handleHeaderClick(e: React.MouseEvent) {
  if (e.button !== 0) return;
  const el = e.target as HTMLElement;
  if (el.closest('[data-tauri-drag-region="false"]')) return;

  const win = getCurrentWebviewWindow();
  win.startDragging();
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

type SettingsSection = "general" | "wechat" | "about";

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "settings">("home");
  const [activeTool, setActiveTool] = useState<string>("urllink");
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("wechat");

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    mini_apps: [],
    default_app_id: null,
    theme: null,
  });

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Apply theme
  useEffect(() => {
    const applyTheme = async (t: "light" | "dark" | "system") => {
      const root = document.documentElement;
      const isDark =
        t === "dark" ||
        (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // 设置 macOS 标题栏颜色
      try {
        const win = getCurrentWebviewWindow();
        await win.setTitleBarStyle("transparent");
        // 通过 CSS 变量控制颜色
        document.documentElement.style.setProperty(
          "--webkit-platform-color",
          isDark ? "#1c1c1e" : "#ffffff"
        );
      } catch (e) {
        // 非 Tauri 环境忽略
      }
    };

    applyTheme(theme).catch(() => {});

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = async () => {
      if (settings.theme === "system" || !settings.theme) {
        await applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, settings.theme]);

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
      if (loaded.theme) {
        setTheme(loaded.theme as "light" | "dark" | "system");
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

  const updateTheme = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const newSettings: AppSettings = {
      ...settings,
      theme: newTheme,
    };
    await saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 pl-20"
        onMouseDown={handleHeaderClick}
      >
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
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 pt-14 flex">
        {/* Left Toolbar Hotbar */}
        <aside id="toolbar-nav" className="fixed left-0 top-14 bottom-0 w-16 border-r bg-background/95 flex flex-col items-center py-4 gap-2 z-40">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => !tool.comingSoon && setActiveTool(tool.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                activeTool === tool.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              } ${tool.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              title={tool.name}
            >
              {tool.icon}
              <span className="sr-only">{tool.name}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-16 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Home Page */}
            {currentPage === "home" && (
              <Home
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                selectedAppId={selectedAppId}
                settings={settings}
                onSelectApp={setSelectedAppId}
              />
            )}

            {/* Settings Page */}
            {currentPage === "settings" && (
              <Settings
                settings={settings}
                theme={theme}
                activeSettingsSection={activeSettingsSection}
                onUpdateSettings={saveSettings}
                onUpdateTheme={updateTheme}
                onSetActiveSection={(section) => setActiveSettingsSection(section as SettingsSection)}
                onGoHome={() => setCurrentPage("home")}
                onSelectApp={setSelectedAppId}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
