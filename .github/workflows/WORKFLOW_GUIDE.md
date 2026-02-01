# GitHub Workflow 配置指南 - omini-toolbox

## 📁 文件位置

将 workflow 文件放置在项目根目录的 `.github/workflows/` 目录中：

```plaintext
omini-toolbox/
├── .github/
│   └── workflows/
│       ├── publish.yml      # 发布 workflow
│       └── test-build.yml   # 测试构建 workflow
├── src/
├── src-tauri/
└── ...
```

## 📋 Workflow 说明

### 1. `publish.yml` - 发布构建

**触发条件：**

- 推送到 `main` 或 `release` 分支
- 创建 `v*` 标签（如 `v1.0.0`）
- 手动触发（workflow_dispatch）

**功能：**

- 在 macOS、Ubuntu、Windows 上构建应用
- 自动创建 GitHub Release
- 上传构建产物（dmg、exe、AppImage 等）
- 支持 macOS universal binary（ARM64 + x86_64）

**输出物：**

- 各平台的可执行文件
- 工作流工件（Workflow Artifacts）

### 2. `test-build.yml` - 测试构建

**触发条件：**

- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop`
- 手动触发

**功能：**

- 编译检查（`cargo check`）
- 调试模式构建
- TypeScript 类型检查
- 前端 Lint 检查（如配置）

## 🚀 快速开始

### 步骤 1：准备工作

确保你的 `package.json` 中有以下命令：

```json
{
  "scripts": {
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

同时确保项目根目录有 `pnpm-lock.yaml` 文件。

### pnpm 特定说明

本项目使用 pnpm 作为包管理器。Workflow 中的配置包括：

1. **自动安装 pnpm：**

   ```yaml
   - uses: pnpm/action-setup@v2
     with:
       version: latest
   ```

2. **pnpm 存储缓存：**
   Workflow 会自动缓存 pnpm 的 store，加速后续构建

3. **使用 frozen-lockfile：**

   ```bash
   pnpm install --frozen-lockfile
   ```

   确保依赖版本与 lock 文件完全一致

### 步骤 2：复制 Workflow 文件

创建 `.github/workflows/` 目录，并将两个 YAML 文件复制到该目录。

### 步骤 3：提交并推送

```bash
git add .github/workflows/
git commit -m "ci: add github workflows"
git push origin main
```

### 步骤 4：查看运行

进入 GitHub 仓库 → **Actions** 标签页，查看 workflow 运行情况。

## 🔧 自定义配置

### 修改构建参数

在 `publish.yml` 中修改 `args` 字段：

```yaml
args: '${{ matrix.args }} --debug'  # 添加 --debug 标志
```

### 修改应用版本

版本号从 `src-tauri/tauri.conf.json` 的 `version` 字段自动读取：

```json
{
  "build": {
    "appIdentifier": "com.example.omini-toolbox",
    "productName": "Omini Toolbox",
    "version": "0.1.0"
  }
}
```

### 修改 Release 信息

在 `publish.yml` 中编辑：

```yaml
tagName: v__VERSION__              # 标签名称
releaseName: 'Release v__VERSION__' # Release 名称
releaseBody: 'Your custom message'  # Release 描述
```

### 禁用工作流工件

如果不需要保存工件，删除或设置为 false：

```yaml
uploadWorkflowArtifacts: false
```

## 📦 平台特定配置

### macOS

Workflow 会自动为 Apple Silicon (M1/M2) 和 Intel Mac 构建：

```yaml
- platform: 'macos-latest'
  args: '--target aarch64-apple-darwin'  # Apple Silicon
  
- platform: 'macos-latest'
  args: '--target x86_64-apple-darwin'   # Intel Mac
```

### Linux

需要 libwebkit2gtk-4.1-dev 等依赖，workflow 会自动安装：

```yaml
- name: 'ubuntu-22.04'
```

### Windows

支持 NSIS 安装程序和 MSI 包。确保 `tauri.conf.json` 中配置了相应的 bundle 类型。

## 🔐 必需权限

Workflow 需要以下 GitHub 权限：

```yaml
permissions:
  contents: write          # 创建 Release 和上传文件
  pull-requests: read      # 读取 PR 信息（可选）
```

**GITHUB_TOKEN** 由 GitHub 自动提供，无需配置密钥。

## 📊 环境变量和密钥

### 默认环境变量

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 如需自定义（可选）

在仓库设置中添加 Secrets：

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加你的密钥（如 signing certificate）

### Tauri 代码签名（可选，macOS）

如果需要代码签名，在 workflow 中添加：

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
  APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## ⚙️ 高级配置

### 条件构建

只在某些条件下运行：

```yaml
if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
```

### 并行优化

使用 `concurrency` 防止重复构建：

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 构建失败重试

```yaml
with:
  retryAttempts: 2
```

## 📝 更新版本发布流程

### 方式 1：通过 Git 标签（推荐）

```bash
# 更新版本号在 tauri.conf.json
# 然后创建标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 自动构建并创建 Release
```

### 方式 2：推送到 release 分支

```bash
git checkout -b release
git commit -m "bump version to 1.0.0"
git push origin release
```

### 方式 3：手动触发

进入 **Actions** → **publish** → **Run workflow**

## 🐛 常见问题

### 1. "cargo not found" 错误

Rust toolchain 安装失败。检查网络连接或使用镜像源：

```yaml
- name: Install Rust stable
  uses: dtolnay/rust-toolchain@stable
  with:
    targets: aarch64-apple-darwin,x86_64-apple-darwin
```

### 2. Ubuntu 构建缺少依赖

确保所有依赖已在 workflow 中安装：

```yaml
- name: Install dependencies (Ubuntu only)
  if: matrix.platform == 'ubuntu-22.04'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### 3. macOS 代码签名失败

需要配置 Apple 开发者证书。参考上述"Tauri 代码签名"部分。

### 4. 构建超时

某些机器上 Rust 编译可能很慢。增加超时时间或使用缓存：

```yaml
- name: Install Rust cache
  uses: Swatinem/rust-cache@v2
```

### 5. Release 已存在错误

如果标签已存在，删除它并重新创建：

```bash
git tag -d v1.0.0
git push origin --delete v1.0.0
git tag v1.0.0
git push origin v1.0.0
```

## 📚 参考资源

- [Tauri Actions 官方文档](https://github.com/tauri-apps/tauri-action)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri 官方文档](https://tauri.app)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)

## ✅ 检查清单

- [ ] 创建 `.github/workflows/` 目录
- [ ] 复制 `publish.yml` 和 `test-build.yml`
- [ ] 验证 `tauri.conf.json` 配置正确
- [ ] 测试 package.json 中的构建脚本
- [ ] 提交并推送到 GitHub
- [ ] 在 Actions 页面验证 workflow 运行
- [ ] 创建第一个版本标签并发布

---

需要帮助？查看相关 GitHub 仓库的 Issues 或查看完整的 workflow 输出日志。
