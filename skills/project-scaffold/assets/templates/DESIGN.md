---
name: {{PROJECT_NAME}} Design System
version: 1.0.0
philosophy: 清晰优先于装饰，键鼠友好，高密度信息
---

# 设计系统

本文件是 UI 视觉的**唯一真相源**。任何前端代码必须遵循此处令牌与规则。
修改视觉方向时先改本文件，再让 AI 重新生成代码。

## 颜色令牌

- `--bg-page`: #F7F8FA (页面底色)
- `--bg-surface`: #FFFFFF (卡片/容器)
- `--text-primary`: #1F2329 (主文本)
- `--text-secondary`: #646A73 (次要文本)
- `--brand-primary`: {{BRAND_PRIMARY}} (主操作、链接、焦点环)
- `--border-default`: #DEE0E3 (默认描边)

**禁止**：引入本表之外的颜色；硬编码 HEX / RGB。

## 字体

- 无衬线: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif
- 等宽: "JetBrains Mono", Consolas, monospace
- 字号刻度: 12 / 14 / 16 / 20 / 28 px
- 字重: 400 正文, 500 标题

## 间距与形状

- 基准网格: 4px
- 间距刻度: 4 / 8 / 12 / 16 / 24 / 32 px
- 圆角: 小 6px, 中 8px, 大 12px
- 描边: 1px solid `--border-default`

## 组件

### 按钮
- 主按钮: 背景 `--brand-primary`, 白字, 圆角 8px, 上下 8px / 左右 16px
- 次按钮: 透明背景, 1px `--border-default` 描边
- Hover: 亮度 +8%, 150ms 过渡
- Disabled: 40% 透明度, 无 hover

### 卡片
- 背景 `--bg-surface`, 1px 描边, 圆角 12px, 内边距 16–24px
- 禁止嵌套超过两层

## 护栏

- DO: 用 token 名引用颜色/间距，不写裸数值
- DO: 按钮文案用句式大写（sentence case）
- DON'T: 使用阴影，改用 1px 描边
- DON'T: 圆角超过 12px
- DON'T: 使用调色板外的颜色或字体
