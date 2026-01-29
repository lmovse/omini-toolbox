use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[derive(Serialize, Deserialize)]
pub struct UrlLinkResult {
    pub path: String,
    pub query: String,
    pub link: String,
    pub err_msg: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MiniAppConfig {
    pub id: String,
    pub name: String,
    pub appid: String,
    pub secret: String,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize)]
pub struct AppSettings {
    pub mini_apps: Vec<MiniAppConfig>,
    pub default_app_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct WechatTokenResponse {
    pub access_token: Option<String>,
    pub expires_in: Option<u64>,
    pub errmsg: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct WechatUrlLinkResponse {
    pub url_link: Option<String>,
    pub err_msg: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ShortLinkItem {
    pub path: String,
    pub query: String,
}

// Token 缓存结构
#[derive(Clone)]
struct TokenCache {
    appid: String,
    token: String,
    expires_at: u64, // 过期时间戳（秒）
}

static TOKEN_CACHE: Lazy<Mutex<Option<TokenCache>>> = Lazy::new(|| Mutex::new(None));

/// 获取应用配置目录
fn get_config_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    let mut dir = PathBuf::from(
        std::env::var("HOME").unwrap_or_else(|_| ".".to_string())
    );
    #[cfg(target_os = "macos")]
    dir.push("Library/Application Support/tata-tool");

    #[cfg(target_os = "windows")]
    let mut dir = PathBuf::from(
        std::env::var("APPDATA").unwrap_or_else(|_| ".")
    );
    #[cfg(target_os = "windows")]
    dir.push("tata-tool");

    #[cfg(target_os = "linux")]
    let mut dir = PathBuf::from(
        std::env::var("XDG_CONFIG_HOME").unwrap_or_else(|_| {
            format!("{}/.config", std::env::var("HOME").unwrap_or_else(|_| ".".to_string()))
        })
    );
    #[cfg(target_os = "linux")]
    dir.push("tata-tool");

    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

fn get_settings_path() -> PathBuf {
    let mut path = get_config_dir();
    path.push("settings.json");
    path
}

/// 加载设置
#[tauri::command]
fn load_settings() -> Result<AppSettings, String> {
    let path = get_settings_path();
    if !path.exists() {
        return Ok(AppSettings {
            mini_apps: Vec::new(),
            default_app_id: None,
        });
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取设置失败: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("解析设置失败: {}", e))
}

/// 保存设置
#[tauri::command]
fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("序列化设置失败: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("保存设置失败: {}", e))
}

fn get_token_cache_path() -> PathBuf {
    let mut path = get_config_dir();
    path.push("token_cache.json");
    path
}

#[derive(Serialize, Deserialize)]
struct TokenCacheFile {
    appid: String,
    token: String,
    expires_at: u64,
}

/// 加载 token 缓存（从磁盘）
fn load_token_cache() -> Option<TokenCacheFile> {
    let path = get_token_cache_path();
    if !path.exists() {
        return None;
    }

    let content = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&content).ok()
}

/// 保存 token 缓存（到磁盘）
fn save_token_cache(cache: &TokenCacheFile) -> Result<(), String> {
    let path = get_token_cache_path();
    let content = serde_json::to_string_pretty(cache)
        .map_err(|e| format!("序列化 token 缓存失败: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("保存 token 缓存失败: {}", e))
}

/// 获取微信 access token (带缓存，持久化到磁盘)
async fn get_wechat_token_cached(appid: &str, secret: &str) -> Result<String, String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("获取时间失败: {}", e))?
        .as_secs();

    // 检查缓存（先从磁盘加载，再检查内存）
    {
        let cache = TOKEN_CACHE.lock().map_err(|e| format!("锁获取失败: {}", e))?;
        if let Some(cached) = cache.as_ref() {
            if cached.appid == appid && cached.expires_at > now + 60 {
                // 缓存有效，剩余时间大于 60 秒
                return Ok(cached.token.clone());
            }
        }
    }

    // 检查磁盘缓存
    if let Some(disk_cache) = load_token_cache() {
        if disk_cache.appid == appid && disk_cache.expires_at > now + 60 {
            let token = disk_cache.token.clone();
            // 磁盘缓存有效，更新内存缓存
            let mut cache = TOKEN_CACHE.lock().map_err(|e| format!("锁获取失败: {}", e))?;
            *cache = Some(TokenCache {
                appid: disk_cache.appid,
                token: token.clone(),
                expires_at: disk_cache.expires_at,
            });
            return Ok(token);
        }
    }

    // 缓存过期或不存在，获取新 token
    println!("[WeChat] 请求 access_token, appid: {}", appid);
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "grant_type": "client_credential",
        "appid": appid,
        "secret": secret
    });

    let response = client
        .post("https://api.weixin.qq.com/cgi-bin/stable_token")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求 token 失败: {}", e))?;

    let text = response.text().await.map_err(|e| format!("读取 token 响应失败: {}", e))?;
    println!("[WeChat] access_token 响应: {}", text);

    let token_resp: WechatTokenResponse = serde_json::from_str(&text)
        .map_err(|e| format!("解析 token 响应失败: {}", e))?;

    if let Some(token) = token_resp.access_token {
        // 计算过期时间（微信返回的是秒数，提前 60 秒刷新）
        let expires_in = token_resp.expires_in.unwrap_or(7200);
        let expires_at = now + expires_in.saturating_sub(60);

        let new_cache = TokenCache {
            appid: appid.to_string(),
            token: token.clone(),
            expires_at,
        };

        // 更新内存缓存
        {
            let mut cache = TOKEN_CACHE.lock().map_err(|e| format!("锁获取失败: {}", e))?;
            *cache = Some(new_cache.clone());
        }

        // 持久化到磁盘
        let disk_cache = TokenCacheFile {
            appid: new_cache.appid,
            token: new_cache.token,
            expires_at: new_cache.expires_at,
        };
        let _ = save_token_cache(&disk_cache);

        Ok(token)
    } else {
        Err(format!(
            "获取 token 失败: {}",
            token_resp.errmsg.unwrap_or_else(|| "未知错误".to_string())
        ))
    }
}

/// 批量生成微信小程序 URL Link
#[tauri::command]
async fn generate_wechat_urllinks(
    appid: String,
    secret: String,
    env_version: String,
    items: Vec<ShortLinkItem>,
) -> Result<Vec<UrlLinkResult>, String> {
    // 获取 token（带缓存）
    let token = get_wechat_token_cached(&appid, &secret).await?;

    let client = reqwest::Client::new();
    let mut results = Vec::new();

    for item in items {
        println!("[WeChat] 生成 URL Link: path={}, query={}", item.path, item.query);
        let mut params = serde_json::Map::new();
        params.insert("path".to_string(), serde_json::Value::String(item.path.clone()));
        params.insert("query".to_string(), serde_json::Value::String(item.query.clone()));
        params.insert("env_version".to_string(), serde_json::Value::String(env_version.clone()));

        let body = serde_json::Value::Object(params);

        let response = client
            .post(&format!(
                "https://api.weixin.qq.com/wxa/generate_urllink?access_token={}",
                token
            ))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await.map_err(|e| format!("读取响应失败: {}", e))?;
        println!("[WeChat] URL Link 响应: {}", text);

        let link_resp: WechatUrlLinkResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;

        results.push(UrlLinkResult {
            path: item.path,
            query: item.query,
            link: link_resp.url_link.unwrap_or_else(|| String::from("")),
            err_msg: link_resp.err_msg.unwrap_or_else(|| String::from("ok")),
        });
    }

    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            generate_wechat_urllinks,
            load_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
