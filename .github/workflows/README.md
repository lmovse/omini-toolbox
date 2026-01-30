# omini-toolbox GitHub Workflow - pnpm 版本

## 📦 生成的文件清单

### Workflow 配置文件（.github/workflows/）

1. **publish.yml** - 发布和构建工作流
   - 触发：push 到 main/release 分支或创建 v* 标签
   - 功能：多平台构建、自动创建 Release、上传产物
   - 使用 pnpm 和 frozen-lockfile 确保依赖一致性

2. **test-build.yml** - CI 测试工作流
   - 触发：PR 和 push 时自动运行
   - 功能：编译检查、类型检查、Lint、调试构建
   - 快速反馈循环，及时发现问题

3. **debug-build.yml** - 调试工作流
   - 触发：手动运行（workflow_dispatch）
   - 功能：选择平台、启用详细日志、诊断构建问题
   - 用于故障排查

### 文档文件

4. **WORKFLOW_GUIDE.md** - 完整使用指南
   - 文件位置说明
   - Workflow 详细功能介绍
   - 快速开始步骤
   - 自定义配置教程
   - 常见问题解答

5. **PNPM_SETUP.md** - pnpm 项目专用配置
   - pnpm 优势介绍
   - 项目检查清单
   - Workflow 配置详解
   - 从 npm/yarn 迁移指南
   - 常见问题和解决方案

6. **WORKFLOW_BEST_PRACTICES.md** - 最佳实践
   - 性能优化技巧
   - 安全配置建议
   - 版本管理策略
   - 成本优化
   - 监控和日志

7. **QUICK_REFERENCE.md** - 快速参考卡
   - 一分钟快速开始
   - 关键改动清单
   - 命令速查表
   - 常见错误修复
   - 验证清单

---

## 🚀 快速部署步骤

### 步骤 1：准备本地环境

```bash
# 进入项目目录
cd omini-toolbox

# 确认 pnpm 已安装
pnpm --version

# 确认 lock 文件存在
ls pnpm-lock.yaml

# 本地验证构建
pnpm install --frozen-lockfile
pnpm run build
```

### 步骤 2：创建 workflows 目录

```bash
mkdir -p .github/workflows
```

### 步骤 3：复制 workflow 文件

```bash
# 复制三个 workflow 文件
cp publish.yml .github/workflows/
cp test-build.yml .github/workflows/
cp debug-build.yml .github/workflows/
```

### 步骤 4：验证文件内容

```bash
ls -la .github/workflows/
# 应该看到：
# publish.yml
# test-build.yml
# debug-build.yml
```

### 步骤 5：提交并推送

```bash
git add .github/
git commit -m "ci: add github workflows for pnpm project"
git push origin main
```

### 步骤 6：监控运行

1. 进入 GitHub 仓库首页
2. 点击 **Actions** 标签
3. 查看 workflow 运行状态
4. 查看日志排查任何问题

---

## ⚙️ 核心改动说明

### 相比原始 npm 版本的主要改动

#### 1️⃣ pnpm 安装（所有 workflow 通用）

```yaml
# 新增：setup pnpm
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: latest

# 必须在 setup-node 之前！
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: lts/*
```

#### 2️⃣ pnpm 缓存配置（加速后续构建）

```yaml
- name: Get pnpm store directory
  id: pnpm-cache
  run: |
    echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v3
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-
```

#### 3️⃣ 依赖安装命令

```yaml
# 之前：npm ci
# 现在：pnpm install --frozen-lockfile
- name: Install frontend dependencies
  run: pnpm install --frozen-lockfile
```

#### 4️⃣ 所有 npm 脚本改为 pnpm

```yaml
# 之前：npm run build
# 现在：pnpm run build
- name: Build the app
  run: pnpm run build
```

---

## 📋 文件结构

```
omini-toolbox/
├── .github/
│   └── workflows/                    # 新增
│       ├── publish.yml               # 发布工作流
│       ├── test-build.yml            # 测试工作流
│       └── debug-build.yml           # 调试工作流
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── tools/
│   │   │   └── UrlLinkTool.tsx
│   │   ├── ToolCard.tsx
│   │   └── ComingSoon.tsx
│   └── assets/
├── src-tauri/
│   ├── src/
│   ├── capabilities/
│   ├── icons/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .github/                          # GitHub 配置
├── pnpm-lock.yaml                    # pnpm 锁定文件 ✅ 重要
├── package.json                      # 项目配置
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔑 关键要点

### ✅ pnpm-lock.yaml 必须提交到 git

```bash
# 确认 lock 文件被追踪
git ls-files | grep pnpm-lock.yaml
# 应该有输出

# 如果没有，添加它
git add pnpm-lock.yaml
git commit -m "add: pnpm lock file"
git push
```

### ✅ package.json 中推荐声明版本

```json
{
  "packageManager": "pnpm@8.15.0"
}
```

### ✅ package.json 中的必需脚本

```json
{
  "scripts": {
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

---

## 🎯 工作流功能总结

### publish.yml（发布）

| 功能 | 说明 |
|------|------|
| **触发条件** | push to main/release 或创建 v* 标签 |
| **构建平台** | macOS (M1+Intel)、Linux、Windows |
| **产物处理** | 自动创建 Release 并上传 |
| **缓存** | Rust + pnpm 双重缓存 |
| **并行构建** | 所有平台并行运行，互不阻塞 |

### test-build.yml（CI 测试）

| 功能 | 说明 |
|------|------|
| **触发条件** | PR 和 push 时自动运行 |
| **检查项目** | Rust check、TypeScript 类型检查、Lint、调试构建 |
| **快速反馈** | 在推送前发现问题 |
| **并行执行** | 不同平台并行测试 |

### debug-build.yml（调试）

| 功能 | 说明 |
|------|------|
| **触发条件** | 手动运行（Actions → debug-build → Run workflow） |
| **参数输入** | 选择平台、启用调试模式 |
| **输出** | 详细日志、系统信息、构建日志 |
| **工件** | 保存目标目录用于分析 |

---

## 📊 性能改善预期

### 依赖安装速度

| 阶段 | npm | pnpm | 改善 |
|------|-----|------|------|
| 首次安装（冷缓存） | ~2-3 分钟 | ~1-1.5 分钟 | ⚡ 40-50% |
| 热缓存安装 | ~30-45 秒 | ~5-10 秒 | ⚡ 70-80% |
| 磁盘空间 | ~500MB+ | ~200-300MB | 💾 60% |

### 总体构建时间（Tauri 应用）

- **第一次构建**：依赖下载时间，改善 30-50%
- **后续构建**：缓存命中，改善 70-80%
- **磁盘占用**：pnpm 更高效，节省约 50-60%

---

## 🐛 常见问题速解

### Q: Actions 报错 "pnpm: command not found"

**A:** setup-node 必须在 pnpm/action-setup 之后。检查顺序：

```yaml
1. uses: pnpm/action-setup@v2  ✅ 先
2. uses: actions/setup-node@v4 ✅ 后
```

### Q: pnpm-lock.yaml not found 错误

**A:** 确保 lock 文件已提交：

```bash
git add pnpm-lock.yaml
git commit -m "add lock file"
git push
```

### Q: "EUSAGE: npm ci 只能用于..."

**A:** 这是你第一次遇到的问题。现在已修复，使用了 `pnpm install --frozen-lockfile`

### Q: 构建仍然很慢

**A:** 可能是冷缓存。后续构建会更快。或使用：

```bash
pnpm install --frozen-lockfile --prefer-offline
```

### Q: "Module not found" 错误

**A:** 显式安装缺失的依赖：

```bash
pnpm add missing-module
git push
```

---

## 🔗 文档导航

| 文档 | 用途 |
|------|------|
| **QUICK_REFERENCE.md** | 📍 从这里开始，快速上手 |
| **WORKFLOW_GUIDE.md** | 📍 详细配置和使用说明 |
| **PNPM_SETUP.md** | 📍 pnpm 特定配置和最佳实践 |
| **WORKFLOW_BEST_PRACTICES.md** | 📍 高级优化和安全建议 |

### 按场景选择

- 🚀 **快速开始？** → QUICK_REFERENCE.md
- 🔧 **需要配置？** → WORKFLOW_GUIDE.md
- 📦 **pnpm 问题？** → PNPM_SETUP.md
- 🎯 **性能优化？** → WORKFLOW_BEST_PRACTICES.md

---

## ✅ 检查清单

### 准备工作
- [ ] 本地已安装 pnpm
- [ ] 项目根目录存在 pnpm-lock.yaml
- [ ] pnpm-lock.yaml 已提交到 git
- [ ] 本地 `pnpm install --frozen-lockfile` 成功
- [ ] 本地 `pnpm run build` 成功

### 部署步骤
- [ ] 创建了 .github/workflows/ 目录
- [ ] 复制了 publish.yml、test-build.yml、debug-build.yml
- [ ] 提交了所有更改
- [ ] 推送到 GitHub

### 验证
- [ ] GitHub Actions 页面能看到 workflow 运行
- [ ] test-build 成功通过
- [ ] 创建标签验证 publish workflow（可选）
- [ ] 检查 Release 创建是否成功（可选）

---

## 🎓 下一步

### 1. 立即尝试
```bash
# 推送到 GitHub，触发 test-build
git push origin main
```

### 2. 创建发布
```bash
git tag v0.1.0
git push origin v0.1.0
# 自动触发 publish workflow，创建 Release
```

### 3. 持续改进
- 监控构建时间
- 根据需要优化
- 参考最佳实践文档

---

## 📞 需要帮助？

1. 📖 查看对应的文档
2. 🔍 检查 GitHub Actions 日志
3. 🐛 查看常见问题部分
4. 💬 提交 issue 或讨论

---

**最后更新**：2025-01-30
**pnpm 版本**：支持 7.0.0+（推荐 8.0.0+）
**Node 版本**：LTS（推荐）
