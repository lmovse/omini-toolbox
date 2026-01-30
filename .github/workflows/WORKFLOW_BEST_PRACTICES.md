# GitHub Workflow 最佳实践 - Tauri 项目

## 🎯 核心原则

### 1. 快速反馈
- 尽早检测问题
- 并行运行不相关的任务
- 使用缓存加速构建

### 2. 可靠性
- 处理瞬时故障（重试）
- 明确的错误消息
- 完整的日志和工件

### 3. 成本效益
- 只在必要时运行昂贵的操作
- 合理使用 GitHub 免费配额
- 优化 runner 成本

## 🚀 性能优化

### 使用缓存

**Rust 编译缓存：**

```yaml
- name: Cache Rust build
  uses: Swatinem/rust-cache@v2
  with:
    workspaces: './src-tauri -> target'
    cache-on-failure: true
    cache-all-crates: true
```

**Node 依赖缓存：**

```yaml
- name: Cache Node modules
  uses: actions/setup-node@v4
  with:
    node-version: lts/*
    cache: 'npm'
    cache-dependency-path: 'package-lock.json'
```

### 并行执行

使用矩阵策略并行构建不同平台：

```yaml
strategy:
  fail-fast: false  # 一个失败不影响其他
  matrix:
    platform:
      - ubuntu-22.04
      - windows-latest
      - macos-latest
```

### 有条件运行步骤

```yaml
- name: Run only on Ubuntu
  if: matrix.platform == 'ubuntu-22.04'
  run: echo "Ubuntu specific task"

- name: Run only on macOS
  if: startsWith(matrix.platform, 'macos')
  run: echo "macOS specific task"
```

## 📊 监控和日志

### 添加详细日志

```yaml
- name: Build with verbose output
  run: cargo build -vvv
  env:
    RUST_LOG: debug
```

### 步骤摘要

在 workflow 中添加摘要信息：

```yaml
- name: Report build status
  run: |
    echo "# Build Report" >> $GITHUB_STEP_SUMMARY
    echo "- Platform: ${{ matrix.platform }}" >> $GITHUB_STEP_SUMMARY
    echo "- Status: Success" >> $GITHUB_STEP_SUMMARY
```

## 🔍 故障排查

### 常见构建失败原因

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| 缺少依赖 | `not found` 错误 | 检查包管理器安装步骤 |
| 网络问题 | 超时或连接错误 | 使用国内镜像或增加超时 |
| 权限问题 | `permission denied` | 检查文件权限或 token |
| 版本冲突 | 编译错误 | 更新锁文件或依赖版本 |

### 调试技巧

1. **使用 debug workflow：**
   ```bash
   # 可以手动输入参数运行
   ```

2. **启用 SSH 调试：**
   ```yaml
   - name: Setup tmate session
     if: failure()
     uses: mxschmitt/action-tmate@v3
   ```

3. **保存工件用于分析：**
   ```yaml
   - name: Upload logs on failure
     if: failure()
     uses: actions/upload-artifact@v4
     with:
       name: build-logs
       path: src-tauri/target/debug/
   ```

## 🔐 安全最佳实践

### 1. 最小权限原则

```yaml
permissions:
  contents: write        # 仅创建 Release
  pull-requests: read    # 仅读取信息
  # 其他权限：不设置
```

### 2. 保护敏感信息

❌ 不要：
```yaml
env:
  SIGNING_KEY: abc123def456
```

✅ 要这样做：
```yaml
env:
  SIGNING_KEY: ${{ secrets.SIGNING_KEY }}
```

### 3. 验证依赖

```yaml
- name: Verify npm packages
  run: |
    npm audit --audit-level=moderate
    npm ci --prefer-offline
```

### 4. 限制 token 作用域

使用专用 token 而不是个人 token：

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # 自动创建的 token
  # 不要使用 PAT（个人访问令牌）
```

## 📋 版本管理

### 语义版本化

遵循 SemVer (Semantic Versioning)：

```
v主版本.次版本.修订版本
v1.2.3
├─ 1: 主版本（重大更改）
├─ 2: 次版本（新功能）
└─ 3: 修订版本（bug 修复）
```

### 版本控制最佳实践

1. **保持版本一致：**
   - `package.json` 中的版本
   - `src-tauri/tauri.conf.json` 中的版本
   - Git 标签版本

2. **使用 Changelog：**
   ```markdown
   ## [1.2.3] - 2025-01-30
   ### Added
   - 新功能描述
   ### Fixed
   - bug 修复描述
   ```

3. **发布前检查清单：**
   ```bash
   - [ ] 更新 CHANGELOG
   - [ ] 更新版本号
   - [ ] 所有测试通过
   - [ ] 代码审查完成
   - [ ] 创建 Git 标签
   ```

## 🎯 GitHub Actions 配额管理

### 免费配额（公开仓库）

- ✅ 无限制的 job 运行
- ✅ 无限制的 workflow 运行
- ✅ 存储空间：500MB Artifacts
- ✅ 无并发限制

### 免费配额（私有仓库）

- 每月 2000 分钟（macOS 是 10 倍）
- 每月 500MB 存储
- 并发数：1

### 优化成本

```yaml
# 只在必要时构建
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'src-tauri/**'
      - 'package.json'
  workflow_dispatch
```

## 📦 Artifact 管理

### 清理旧 Artifacts

```yaml
- name: Delete old artifacts
  uses: geekyeggo/delete-artifact@v2
  with:
    name: '*'
    failOnError: false
```

### 保留重要 Artifacts

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: release-build
    path: src-tauri/target/release/
    retention-days: 90
    compression-level: 9  # 最大压缩
```

## 🔄 持续集成策略

### 推荐工作流

```
┌─────────────────────────────────────────┐
│ 1. PR 提交                              │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│ 2. 快速检查（并行）                      │
│  - Lint                                 │
│  - Type Check                           │
│  - Unit Tests                           │
│  - 调试构建                             │
└────────┬────────────────────────────────┘
         │
         ├─ 失败 → 返回修复
         │
         ↓ 成功
┌─────────────────────────────────────────┐
│ 3. 合并到 main                          │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│ 4. Release 构建（自动）                 │
│  - 构建所有平台                         │
│  - 创建 GitHub Release                  │
│  - 上传产物                             │
└─────────────────────────────────────────┘
```

## 🚀 创建发布的完整流程

### 1. 准备发布

```bash
# 确保本地分支是最新的
git checkout main
git pull origin main

# 更新版本号
# - 修改 package.json
# - 修改 src-tauri/tauri.conf.json
# - 更新 CHANGELOG.md

git add .
git commit -m "chore: bump version to 1.2.3"
```

### 2. 创建标签

```bash
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

### 3. 监控构建

进入 GitHub Actions，观察发布 workflow 执行进程。

### 4. 验证发布

- 检查 Releases 页面
- 下载并测试构建产物
- 验证签名（如有配置）

## 📚 学习资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Tauri 部署指南](https://tauri.app/en/v1/guides/distribution/)
- [Rust 在 CI/CD 中的最佳实践](https://doc.rust-lang.org/cargo/build-cache.html)
- [SemVer 规范](https://semver.org/lang/zh-CN/)

## ✅ 完整检查清单

### 初始设置
- [ ] 创建 `.github/workflows/` 目录
- [ ] 添加 workflow 文件
- [ ] 配置仓库权限
- [ ] 测试本地构建

### 优化
- [ ] 启用 Rust 缓存
- [ ] 启用 Node 缓存
- [ ] 配置并行构建
- [ ] 设置正确的 retention-days

### 安全
- [ ] 限制 token 权限
- [ ] 使用 Secrets 管理敏感信息
- [ ] 审核依赖安全性
- [ ] 启用分支保护

### 文档
- [ ] 编写 CHANGELOG
- [ ] 记录发布流程
- [ ] 创建故障排查指南
- [ ] 分享最佳实践

---

需要更多帮助？查看具体的 workflow 错误日志或提交 issue。
