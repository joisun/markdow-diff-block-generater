# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个 Markdown Diff Block 生成器，用于将文本对比结果生成为 markdown diff 代码块。主要用于文档、README 或 GitHub 评论中展示代码变更。

技术栈：
- React 18 + TypeScript
- Vite (构建工具)
- CodeMirror 6 (代码编辑器)
- diff 库 (文本对比)
- Tailwind CSS + shadcn/ui (UI 组件)

## Commands

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 添加 shadcn/ui 组件
npm run shad:add <component-name>
```

## Architecture

### 应用模式

应用支持两种模式：
- **Dual Mode**: 传统的双文本对比模式
- **Timeline Mode**: 多版本时间线对比模式

### Dual Mode（传统模式）

- **DualTextMode.tsx**: 双文本对比组件
  - 使用 `diff` 库的 `diffLines()` 进行文本对比
  - 通过 CodeMirror 6 提供三个编辑器视图：原始文本、修改文本、diff 结果
  - diff 结果使用 `@codemirror/legacy-modes/mode/diff` 进行语法高亮

### Timeline Mode（多版本模式）

**新增功能**：多版本 Diff Timeline 查看器

**组件结构**：
- `TimelineMode.tsx`: 状态管理，管理 versions 数组和 focusedDiffIndex
- `DiffTimeline.tsx`: 横向滚动容器，渲染 V-D-V-D-V 节点序列
- `VersionPanel.tsx`: 单个版本编辑器，支持 shrink 状态
- `DiffPanel.tsx`: Diff 面板，支持 collapsed (mini-map) 和 expanded (full viewer) 两种状态
- `InsertButton.tsx`: 版本插入按钮

**数据模型**：
```typescript
interface Version {
  id: string        // UUID
  content: string
  label?: string
}
```

**交互逻辑**：
- 点击 diff panel → 展开为完整 viewer，左侧版本 shrink
- 点击 + 按钮 → 在两个版本之间插入空版本
- 删除版本 → 最少保留 2 个版本
- 键盘导航 → Left/Right 切换 diff，Escape 取消聚焦

**复制功能**：
- 单个 diff: 复制为单个 markdown code block
- 全局复制: 复制所有 diff 为多个 code block，带版本标注

### 核心逻辑（已重构）

- **App.tsx**: 应用主组件，支持模式切换
  - 管理全局状态：fontSize, theme, mode
  - 根据 mode 渲染 DualTextMode 或 TimelineMode
  - 提供统一的 editorTheme 配置

### 状态管理

**App 层级**：
- `mode`: 'dual' | 'timeline' - 当前模式
- `fontSize`: 编辑器字体大小（9-24px）
- `theme`: 'dark' | 'light' - 主题模式

**DualTextMode**：
- `originText` / `changedText`: 输入文本
- `isExpanded`: 结果面板展开状态

**TimelineMode**：
- `versions`: Version[] - 版本数组
- `focusedDiffIndex`: number | null - 当前聚焦的 diff 索引

### UI 组件

- 使用 shadcn/ui 组件库（New York 风格）
- 路径别名 `@/*` 映射到 `src/*`
- 组件位于 `src/components/ui/`
- 自定义主题通过 `theme-provider.tsx` 实现

### 样式约定

- Tailwind CSS 作为主要样式方案
- 自定义滚动条样式在 `App.css` 中定义
- 使用 CSS 变量实现主题切换
- CodeMirror 编辑器主题通过 `EditorView.theme()` 动态生成

## Code Style

遵循 ESLint 配置（eslint.config.js）：
- 无分号（semi: never）
- 单引号（quotes: single）
- 2 空格缩进
- 尾随逗号（comma-dangle: always-multiline）
- 未使用变量以 `_` 开头可忽略

## Important Notes

- 项目使用 `base: "./"` 配置以支持 GitHub Pages 部署
- 复制功能会自动包裹 diff 内容为 markdown 代码块格式（\`\`\`diff ... \`\`\`）
- CodeMirror 扩展和主题需要根据 dark/light 模式动态切换
- 字体大小范围限制在 9-24px 之间
