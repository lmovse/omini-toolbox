[English](README.md) | 中文

# Omini ToolBox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Platform Support](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![Tauri Version](https://img.shields.io/badge/Tauri-2.x-任意)
![React Version](https://img.shields.io/badge/React-19-61dafb)

一个基于 Tauri + React 构建的跨平台桌面工具箱应用。

![Omini ToolBox](./docs/screenshot_homepage.png)

## 功能特性

### 核心功能

- **微信小程序 URL Link 生成** - 通过微信 API 批量生成小程序 URL Link
- **小程序配置管理** - 管理多个微信小程序的 AppID 和 AppSecret
- **主题支持** - 浅色/深色/跟随系统三种主题模式
- **设置持久化** - 本地存储配置和 Token 缓存

### 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: Tauri 2 (Rust)
- **存储**: 本地 JSON 文件

## 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.70
- Pnpm >= 8
- Tauri CLI

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建应用

```bash
pnpm tauri build
```

## 项目结构

```
omini-toolbox/
├── src/                          # 前端 React 代码
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 主应用组件
│   ├── index.css                 # 全局样式
│   ├── pages/                    # 页面组件
│   │   ├── Home.tsx              # 首页
│   │   └── Settings.tsx          # 设置页面
│   ├── components/               # 公共组件
│   │   ├── tools/                # 工具组件
│   │   │   └── UrlLinkTool.tsx   # URL Link 生成器
│   │   ├── ToolCard.tsx          # 工具卡片
│   │   └── ComingSoon.tsx        # 即将上线占位符
│   └── assets/                   # 静态资源
├── src-tauri/                    # Tauri 后端 (Rust)
│   ├── src/                      # Rust 源码
│   │   ├── main.rs               # 入口文件
│   │   └── lib.rs                # 核心逻辑
│   ├── capabilities/             # 权限定义
│   ├── gen/                      # 生成代码
│   ├── icons/                    # 应用图标
│   ├── build.rs                  # 构建脚本
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json           # Tauri 配置
├── public/                       # 公共静态文件
├── docs/                         # 文档和截图
├── index.html                    # HTML 入口
├── package.json                  # Node 依赖
├── vite.config.ts                # Vite 配置
├── tailwind.config.js            # Tailwind CSS 配置
└── tsconfig.json                 # TypeScript 配置
```

## 路线图

- 二维码生成
- URL 编码/解码
- 时间戳转换

## 开源协议

本项目采用 MIT License 开源。

## 贡献

欢迎提交 Issue 和 Pull Request！
