# tauri-action 版本更新说明

## ⚠️ 重要更新：tauri-action@v1 已停用

**问题**：`tauri-apps/tauri-action@v1` 已经从 GitHub Actions Marketplace 中移除。

**解决方案**：所有 workflow 文件已更新为使用 `tauri-apps/tauri-action@v0`

## 📋 当前状态

### 已更新的文件

✅ **publish.yml** - 已更新为 `v0`
✅ **test-build.yml** - 已更新为 `v0`  
✅ **debug-build.yml** - 已更新为 `v0`

### 版本历史

| 版本 | 状态 | 说明 |
|------|------|------|
| v1 | ❌ 已停用 | 不再可用 |
| v0 | ✅ 当前 | 活跃维护，推荐使用 |
| v0.6.1 | 最新 | 2025-01-03 发布 |
| v0.6.0 | 稳定 | 2024-11-12 发布 |

## 🔄 版本标签说明

### 使用 `@v0` 的优势

```yaml
uses: tauri-apps/tauri-action@v0
```

- ✅ 自动获取 `v0.x` 系列的最新版本
- ✅ 不需要手动更新版本号
- ✅ 向后兼容
- ✅ 获得最新的 bug 修复

### 使用特定版本的方式

如果需要锁定到特定版本（如 `v0.6.1`）：

```yaml
uses: tauri-apps/tauri-action@v0.6.1
```

## 📝 最新版本更新内容（v0.6.0）

发布时间：2024-11-12

### 新功能

1. **自动生成 Release Notes**
   ```yaml
   with:
     generateReleaseNotes: true
   ```

2. **Gitea 支持（实验性）**
   ```yaml
   with:
     isGitea: true
     githubBaseUrl: 'https://your-gitea-instance.com'
   ```

3. **自定义 GitHub API 地址**
   ```yaml
   with:
     githubBaseUrl: 'https://github.enterprise.com'
   ```

### 重要修复

- 修复了 tauri v2 应用中的文件名识别问题
- 改进了资源管理和缓存处理

### 系统要求更新

- 需要 GitHub runner `v2.327.1` 或更高版本
- Node v24 支持

## 🔍 如何检查版本

在 GitHub Actions 运行日志中查看实际使用的版本：

```
Run tauri-apps/tauri-action@v0
  with:
    projectPath: 
    args: 
    tauriScript: 
    tagName: v__VERSION__
    releaseName: Release v__VERSION__
    ...
tauri-cli version: 2.x.x
```

## ✅ 验证你的 workflow

1. **打开 GitHub 仓库**
2. **进入 Actions 标签页**
3. **查看 workflow 运行日志**
4. **确认没有 "Unable to resolve action" 错误**

## 🚀 更新步骤

如果你已经有旧的 workflow，只需修改这一行：

```yaml
# 旧的（不工作）
- uses: tauri-apps/tauri-action@v1

# 新的（推荐）
- uses: tauri-apps/tauri-action@v0
```

## 📚 相关资源

- [tauri-action GitHub 仓库](https://github.com/tauri-apps/tauri-action)
- [tauri-action Releases](https://github.com/tauri-apps/tauri-action/releases)
- [tauri-action 完整使用说明](https://github.com/tauri-apps/tauri-action#usage)

## 💡 建议

### 开发推荐

对于新项目，始终使用：

```yaml
uses: tauri-apps/tauri-action@v0
```

这样可以自动获取最新的维护版本。

### 生产推荐

如果需要稳定性，可以固定到特定版本：

```yaml
uses: tauri-apps/tauri-action@v0.6.1
```

然后定期检查更新。

## 🔐 安全性

- 官方 GitHub Action 由 Tauri 团队维护
- 所有版本都经过审查和测试
- 建议定期更新以获得安全补丁

## ❓ FAQ

### Q: 为什么 v1 被移除？

A: tauri-action 的版本命名策略发生了变化。最新的活跃版本是 v0.x 系列。

### Q: v0 是稳定版本吗？

A: 是的，v0.6.x 是当前的稳定版本，正在积极维护。

### Q: 我应该更新到 v0.6.1 吗？

A: 如果你使用的是 v0.5.x 或更早的版本，建议更新到 v0.6.x 以获得最新的功能和修复。

### Q: v0 和 v1 之间有什么不同？

A: 没有实际的 v1 版本。tauri-action 的版本标签仅使用 v0.x 格式。

## 📞 获取帮助

如果遇到问题：

1. 检查 GitHub Actions 日志
2. 查看 [tauri-action Issues](https://github.com/tauri-apps/tauri-action/issues)
3. 查看 [Tauri 官方文档](https://tauri.app)

---

**最后更新**：2025-01-30  
**当前推荐版本**：tauri-apps/tauri-action@v0
