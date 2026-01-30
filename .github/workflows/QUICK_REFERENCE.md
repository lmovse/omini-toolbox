# pnpm + Tauri Workflow 快速参考

## 🚀 一分钟快速开始

### 1️⃣ 确认 pnpm 环境

```bash
# 检查 pnpm 是否已安装
which pnpm
pnpm --version

# 检查 lock 文件存在
ls pnpm-lock.yaml

# 本地测试构建
pnpm install --frozen-lockfile
pnpm run build
```

### 2️⃣ 复制 Workflow 文件

```bash
mkdir -p .github/workflows
cp publish.yml .github/workflows/
cp test-build.yml .github/workflows/
cp debug-build.yml .github/workflows/
```

### 3️⃣ 提交并推送

```bash
git add .github/
git commit -m "ci: add github workflows with pnpm"
git push origin main
```

### 4️⃣ 监控执行

进入 GitHub 仓库 → **Actions** 标签页

---

## 📋 Workflow 文件对比

### 原始（npm）vs 已更新（pnpm）

| 步骤 | npm | pnpm |
|-----|-----|------|
| 包管理器设置 | - | ✅ `pnpm/action-setup@v2` |
| 缓存配置 | - | ✅ `pnpm store path` |
| 依赖安装 | `npm ci` | `pnpm install --frozen-lockfile` |
| 运行脚本 | `npm run` | `pnpm run` |
| 速度 | 中等 | ⚡ 更快 |

---

## 🔥 关键改动清单

### ✅ 已在以下文件中更新

- [x] **publish.yml** - 发布构建
  - 添加 pnpm/action-setup
  - 配置 pnpm 存储缓存
  - 改用 `pnpm install --frozen-lockfile`

- [x] **test-build.yml** - CI 测试
  - 添加 pnpm/action-setup
  - 配置 pnpm 存储缓存
  - 所有 `npm run` 改为 `pnpm run`

- [x] **debug-build.yml** - 调试构建
  - 添加 pnpm/action-setup
  - 配置 pnpm 存储缓存
  - 改用 pnpm 命令

---

## 🎯 核心 Workflow 配置

### pnpm 安装（所有 workflow 通用）

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: latest

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: lts/*

- name: Get pnpm store directory
  id: pnpm-cache
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v3
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

---

## ⚙️ 命令速查表

### 本地开发

```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add package-name
pnpm add -D @types/node

# 构建
pnpm run build

# 类型检查
pnpm run type-check

# Lint
pnpm run lint

# 查看锁定的依赖
pnpm list
```

### GitHub Actions 中

```bash
# 安装（冻结 lock 文件）
pnpm install --frozen-lockfile

# 构建
pnpm run build

# 类型检查
pnpm run type-check

# Lint
pnpm run lint
```

---

## 🔐 必需配置

### ✅ package.json 中的版本声明（推荐）

```json
{
  "packageManager": "pnpm@8.15.0"
}
```

### ✅ 项目根目录文件

```
omini-toolbox/
├── pnpm-lock.yaml ✅ (已提交到 git)
├── package.json ✅
├── .npmrc (可选)
└── .github/workflows/
    ├── publish.yml ✅
    ├── test-build.yml ✅
    └── debug-build.yml ✅
```

---

## 🚨 常见错误修复

### ❌ "pnpm: command not found"

```yaml
# ❌ 错误顺序
- uses: actions/setup-node@v4
- uses: pnpm/action-setup@v2  # 太晚了！

# ✅ 正确顺序
- uses: pnpm/action-setup@v2
- uses: actions/setup-node@v4
```

### ❌ "pnpm-lock.yaml not found"

```bash
# 本地生成 lock 文件
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lock file"
git push
```

### ❌ "Module not found" 错误

```bash
# 显式安装缺失的依赖
pnpm add missing-package
pnpm install
git push
```

---

## 📊 性能对比

### 构建时间示例（Tauri + React）

| 步骤 | npm | pnpm | 优化 |
|-----|-----|------|------|
| 依赖安装（冷） | ~2-3m | ~1-1.5m | ⚡ 40-50% |
| 依赖安装（热） | ~30-45s | ~5-10s | ⚡ 70-80% |
| 完整构建 | ~5-8m | ~4-6m | ⚡ 20-30% |

---

## ✅ 验证清单

### 发布前

- [ ] 本地 `pnpm install --frozen-lockfile` 成功
- [ ] 本地 `pnpm run build` 成功
- [ ] `pnpm-lock.yaml` 已提交到 git
- [ ] Workflow 文件已复制到 `.github/workflows/`

### 提交后

- [ ] Actions 页面能看到工作流运行
- [ ] test-build 通过
- [ ] 修复任何错误
- [ ] 创建标签触发 publish（可选）
- [ ] 验证 Release 创建成功

---

## 🔗 重要链接

- 📖 [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - 完整使用指南
- 📖 [PNPM_SETUP.md](./PNPM_SETUP.md) - pnpm 详细配置
- 📖 [WORKFLOW_BEST_PRACTICES.md](./WORKFLOW_BEST_PRACTICES.md) - 最佳实践
- 🔗 [pnpm 官方文档](https://pnpm.io/)
- 🔗 [Tauri 部署指南](https://tauri.app/en/v1/guides/distribution/)

---

## 💡 Pro Tips

### 1. 自动更新依赖

添加到 Workflow（可选）：

```yaml
- name: Check outdated dependencies
  run: pnpm outdated || true
```

### 2. 加速构建

在 `pnpm install` 中添加：

```bash
pnpm install --frozen-lockfile --no-audit --prefer-offline
```

### 3. 监控缓存

查看缓存命中率：

```bash
# GitHub Actions 日志中会显示
# "Cache hit" 或 "Cache miss"
```

### 4. 本地测试 Workflow

使用 `act` 本地测试：

```bash
npm install -g act
act -j test-build  # 测试 test-build workflow
```

---

**需要帮助？** 查看相关文档或检查 Actions 日志输出。
