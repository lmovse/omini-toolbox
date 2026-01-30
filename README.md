[English](README.md) | [中文](README.zh-CN.md)

# Omini ToolBox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Platform Support](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![Tauri Version](https://img.shields.io/badge/Tauri-2.x-任意)
![React Version](https://img.shields.io/badge/React-19-61dafb)

A cross-platform desktop toolbox application built with Tauri + React.

![Omini ToolBox](./docs/screenshot_homepage.png)

## Features

### Core Features

- **WeChat Mini Program URL Link Generation** - Batch generate Mini Program URL Links via WeChat API
- **Mini Program Configuration Management** - Manage multiple WeChat Mini Program AppID and AppSecret
- **Theme Support** - Light/Dark/System-following theme modes
- **Settings Persistence** - Local storage for configuration and Token cache

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Tauri 2 (Rust)
- **Storage**: Local JSON files

## Getting Started

### Prerequisites

- Node.js >= 18
- Rust >= 1.70
- Pnpm >= 8
- Tauri CLI

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
pnpm tauri dev
```

### Build Application

```bash
pnpm tauri build
```

## Project Structure

```
omini-toolbox/
├── src/                          # Frontend React code
│   ├── main.tsx                  # Application entry
│   ├── App.tsx                   # Main application component
│   ├── index.css                 # Global styles
│   ├── pages/                    # Page components
│   │   ├── Home.tsx              # Home page
│   │   └── Settings.tsx          # Settings page
│   ├── components/               # Shared components
│   │   ├── tools/                # Tool components
│   │   │   └── UrlLinkTool.tsx   # URL Link generator
│   │   ├── ToolCard.tsx          # Tool card
│   │   └── ComingSoon.tsx        # Coming soon placeholder
│   └── assets/                   # Static assets
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/                      # Rust source
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Core logic
│   ├── capabilities/             # Capability definitions
│   ├── gen/                      # Generated code
│   ├── icons/                    # App icons
│   ├── build.rs                  # Build script
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── public/                       # Public static files
├── docs/                         # Documentation & screenshots
├── index.html                    # HTML entry
├── package.json                  # Node dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Roadmap

- QR Code generation
- URL encode/decode
- Timestamp conversion

## License

This project is licensed under the MIT License.

## Contributing

Issues and Pull Requests are welcome!
