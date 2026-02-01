use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::Utc;

use crate::get_config_dir;

/// 获取日志目录
pub fn get_logs_dir() -> PathBuf {
    let mut dir = get_config_dir();
    dir.push("logs");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

// Error log entry
#[derive(Serialize, Deserialize, Clone)]
pub struct ErrorLogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub stack_trace: Option<String>,
    pub source: String, // "frontend" or "backend"
}

fn get_error_log_path() -> PathBuf {
    let mut path = get_logs_dir();
    path.push("errors.json");
    path
}

/// 记录错误日志
pub fn log_error(
    message: &str,
    stack_trace: Option<&str>,
    level: &str,
    source: &str,
) {
    let timestamp = Utc::now().to_rfc3339();
    let entry = ErrorLogEntry {
        timestamp,
        level: level.to_string(),
        message: message.to_string(),
        stack_trace: stack_trace.map(|s| s.to_string()),
        source: source.to_string(),
    };

    // 读取现有日志
    let mut logs: Vec<ErrorLogEntry> = if let Ok(content) = fs::read_to_string(get_error_log_path()) {
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };

    // 添加新错误
    logs.push(entry);

    // 只保留最近的 100 条错误日志
    if logs.len() > 100 {
        let keep_from = logs.len() - 100;
        let new_logs: Vec<ErrorLogEntry> = logs.iter().skip(keep_from).cloned().collect();
        logs = new_logs;
    }

    // 写入日志
    if let Ok(content) = serde_json::to_string_pretty(&logs) {
        let _ = fs::write(get_error_log_path(), content);
    }

    // 同时输出到控制台
    match level {
        "error" => error!("[{}] {}", source, message),
        "warn" => warn!("[{}] {}", source, message),
        _ => info!("[{}] {}", source, message),
    }
}

/// 初始化日志系统
pub fn init_logs() {
    #[cfg(debug_assertions)]
    {
        // 开发环境使用终端输出
        let _ = simplelog::SimpleLogger::init(log::LevelFilter::Info, simplelog::Config::default());
    }
    #[cfg(not(debug_assertions))]
    {
        // 生产环境可以写入文件
        let log_path = get_logs_dir().join("app.log");
        let _ = simplelog::WriteLogger::init(
            log::LevelFilter::Info,
            simplelog::Config::default(),
            std::fs::File::create(log_path).unwrap_or_else(|_| std::fs::File::create("error.log").unwrap()),
        );
    }
}

/// 记录前端错误
#[tauri::command]
fn log_frontend_error(message: String, stack: Option<String>) {
    log_error(&message, stack.as_deref(), "error", "frontend");
}

/// 记录后端错误（带堆栈）
#[tauri::command]
fn log_backend_error(message: String, stack: Option<String>) {
    log_error(&message, stack.as_deref(), "error", "backend");
}

/// 获取所有错误日志
#[tauri::command]
fn get_error_logs() -> Result<Vec<ErrorLogEntry>, String> {
    let path = get_error_log_path();
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取错误日志失败: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("解析错误日志失败: {}", e))
}

/// 清除所有错误日志
#[tauri::command]
fn clear_error_logs() -> Result<(), String> {
    let path = get_error_log_path();
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("删除错误日志失败: {}", e))?;
    }
    Ok(())
}

/// 发送错误报告
#[tauri::command]
async fn send_error_report(_email: String, errors_json: String) -> Result<(), String> {
    use std::fs;

    // 解析前端传来的错误数据
    let frontend_errors: Vec<ErrorLogEntry> = serde_json::from_str(&errors_json)
        .map_err(|e| format!("解析错误数据失败: {}", e))?;

    // 获取后端错误日志
    let backend_errors = get_error_logs()?;

    // 构建邮件内容
    let mut report = String::new();
    report.push_str("=== Omini ToolBox 错误报告 ===\n\n");
    report.push_str(&format!("报告时间: {}\n", Utc::now().to_rfc3339()));
    report.push_str(&format!("系统: {}\n\n", std::env::consts::OS));

    // 前端错误
    if !frontend_errors.is_empty() {
        report.push_str("--- 前端错误 ---\n");
        for (i, err) in frontend_errors.iter().enumerate() {
            report.push_str(&format!("{} [{}] {}\n", i + 1, err.timestamp, err.message));
            if let Some(stack) = &err.stack_trace {
                report.push_str(&format!("Stack: {}\n", stack));
            }
        }
        report.push_str("\n");
    }

    // 后端错误
    if !backend_errors.is_empty() {
        report.push_str("--- 后端错误 ---\n");
        for (i, err) in backend_errors.iter().enumerate() {
            report.push_str(&format!("{} [{}] [{}] {}\n", i + 1, err.timestamp, err.level, err.message));
            if let Some(stack) = &err.stack_trace {
                report.push_str(&format!("Stack: {}\n", stack));
            }
        }
        report.push_str("\n");
    }

    if frontend_errors.is_empty() && backend_errors.is_empty() {
        report.push_str("没有记录的错误。\n");
    }

    // 保存报告到文件
    let report_path = get_logs_dir().join(format!("error_report_{}.txt", Utc::now().format("%Y%m%d_%H%M%S")));
    let _ = fs::write(&report_path, &report);

    info!("错误报告已保存到: {:?}", report_path);
    warn!("错误报告已生成，但邮件发送功能需要配置 SMTP 服务器");

    Ok(())
}

/// 导出 Tauri 命令
pub fn generate_commands() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::new("error_logger")
        .invoke_handler(tauri::generate_handler![
            log_frontend_error,
            log_backend_error,
            get_error_logs,
            clear_error_logs,
            send_error_report
        ])
        .build()
}
