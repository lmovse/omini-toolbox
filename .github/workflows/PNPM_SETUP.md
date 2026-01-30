# pnpm 项目 Workflow 配置

## 📋 pnpm 概述

pnpm 是一个快速、节省磁盘空间的包管理器，相比 npm 有以下优势：

- **更快的安装速度** - 使用硬链接和符号链接
- **节省磁盘空间** - 共享依赖
- **更严格的依赖** - 防止幽灵依赖
- **monorepo 支持** - 原生支持工作区

## ✅ 项目检查清单

### 本地环境验证

```bash
# 1. 检查 pnpm 版本
pnpm --version

# 2. 确认 pnpm-lock.yaml 存在
ls -la pnpm-lock.yaml

# 3. 验证本地构建成功
pnpm install
pnpm run build

# 4. 提交 lock 文件
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lock file"
```

### package.json 配置

推荐在 `package.json` 中声明 pnpm 版本：

```json
{
  "name": "omini-toolbox",
  "version": "0.1.0",
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "devDependencies": {
    "pnpm": "^8.15.0"
  }
}
```

## 🔧 Workflow 配置详解

### pnpm 安装步骤

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: latest  # 或指定具体版本如 "8.15.0"

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: lts/*
```

**为什么顺序很重要：**
1. 先安装 pnpm
2. 再安装 Node.js
3. GitHub Actions 会自动添加 pnpm 到 PATH

### pnpm 缓存配置

```yaml
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
```

**缓存原理：**
- `pnpm store path` 返回 pnpm 的全局存储目录
- 使用 `pnpm-lock.yaml` 作为缓存 key
- 当 lock 文件变化时，缓存自动失效并重新生成

### 依赖安装

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**参数说明：**
- `--frozen-lockfile` - 严格模式，lock 文件不会被修改（CI 环境推荐）
- `--prefer-offline` - 优先使用本地缓存（可选）
- `--no-audit` - 跳过安全审计（加速构建）

## 🚀 常见命令

### 本地开发

```bash
# 安装所有依赖
pnpm install

# 添加新的开发依赖
pnpm add -D @types/node

# 添加生产依赖
pnpm add axios

# 更新所有依赖到最新版本
pnpm update

# 更新到最新的 minor 版本
pnpm update --latest

# 移除依赖
pnpm remove axios

# 检查过期的依赖
pnpm outdated
```

### 构建和测试

```bash
# 构建项目
pnpm run build

# 类型检查
pnpm run type-check

# Lint 检查
pnpm run lint

# 格式化代码
pnpm run format
```

### monorepo 命令（如果使用）

```bash
# 在所有工作区运行命令
pnpm -r build

# 只在某个工作区运行
pnpm --filter @workspace/package build

# 列出所有工作区
pnpm ls --depth -1
```

## 🔄 从 npm/yarn 迁移

### 1. 安装 pnpm

```bash
npm install -g pnpm@latest
```

### 2. 清理旧的锁文件

```bash
rm -f package-lock.json yarn.lock
```

### 3. 使用 pnpm 安装依赖

```bash
pnpm install
```

这会生成 `pnpm-lock.yaml`

### 4. 验证构建

```bash
pnpm run build
pnpm run type-check
pnpm run lint
```

### 5. 提交到 git

```bash
git add pnpm-lock.yaml
git rm -f package-lock.json yarn.lock
git commit -m "chore: migrate to pnpm"
git push
```

## 📊 性能对比

| 操作 | npm | yarn | pnpm |
|------|-----|------|------|
| 首次安装 | 中等 | 快 | 最快 |
| 热安装 | 快 | 快 | 最快 |
| 磁盘空间 | 最多 | 中等 | 最少 |
| 幽灵依赖 | 有 | 无 | 无 |

## 🐛 常见问题

### 1. "ERR_PNPM_PEER_DEP_UNMET"

某些依赖的 peer 依赖未安装。

**解决方案：**
```bash
pnpm install --no-strict-peer-deps
```

或在 `.npmrc` 中添加：
```
strict-peer-dependencies=false
```

### 2. "Module not found" 错误

可能是幽灵依赖问题（依赖的依赖被直接使用）。

**解决方案：**
```bash
# 显式安装缺失的依赖
pnpm add react-dom
```

### 3. 构建缓存失效

Lock 文件改变时缓存失效，这是正常行为。

**优化方案：**
使用 `--prefer-offline` 加速重新安装

### 4. GitHub Actions 超时

pnpm 安装仍然超时的话：

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile --no-audit --prefer-offline
  timeout-minutes: 10
```

### 5. Windows 上的权限问题

某些版本的 pnpm 在 Windows 上可能有符号链接权限问题。

**解决方案：**
```bash
# 在 .npmrc 中禁用符号链接
symlink=false
```

## 🛠️ .npmrc 配置

在项目根目录创建 `.npmrc` 文件：

```ini
# 存储位置（可选）
store-dir=node_modules/.pnpm

# 严格的 peer 依赖（推荐）
strict-peer-dependencies=true

# 符号链接（默认启用）
symlink=true

# 不审计（CI 中加速）
audit=false

# 检查最新版本
check-latest=false

# 注册表
registry=https://registry.npmjs.org/
```

## ✨ Workflow 最佳实践

### 1. 指定 pnpm 版本

```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 8.15.0  # 使用具体版本而不是 latest
```

### 2. 启用 CI 优化

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile --no-audit
  env:
    CI: true
```

### 3. 并行执行

```yaml
- name: Install and build
  run: |
    pnpm install --frozen-lockfile
    pnpm run type-check &
    pnpm run lint &
    pnpm run build
    wait
```

### 4. 版本一致性检查

```yaml
- name: Check pnpm version
  run: |
    LOCK_PNPM_VERSION=$(grep -A 1 'lockfileVersion:' pnpm-lock.yaml | tail -1 | sed 's/[^0-9.]//g')
    INSTALLED_PNPM_VERSION=$(pnpm --version)
    echo "Lock file pnpm version: $LOCK_PNPM_VERSION"
    echo "Installed pnpm version: $INSTALLED_PNPM_VERSION"
```

## 📚 官方资源

- [pnpm 官方文档](https://pnpm.io/)
- [pnpm GitHub Action](https://github.com/pnpm/action-setup)
- [pnpm CLI 参考](https://pnpm.io/cli/add)
- [pnpm 最佳实践](https://pnpm.io/faq)

## ✅ 验证清单

- [ ] 本地安装 pnpm
- [ ] 项目根目录存在 `pnpm-lock.yaml`
- [ ] `package.json` 中声明 packageManager 字段
- [ ] 测试本地构建成功
- [ ] GitHub Workflows 中配置 pnpm/action-setup
- [ ] 验证 Actions 运行成功
- [ ] 检查构建时间是否改善
- [ ] 团队成员也更新到 pnpm

---

有任何 pnpm 相关的问题，查阅官方文档或提交 issue。
