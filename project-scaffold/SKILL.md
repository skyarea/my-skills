---
name: project-scaffold
description: 为一个新项目一次性生成标准化元规范文档集（根目录 AGENTS.md、README.md、DESIGN.md，docs/ 下 status.md、技术规范.md、开发环境.md、git规则.md）并安装 git hook，把每份文档拆成固定骨架与可变槽位，跨项目复用。当用户要求「初始化项目规范」「生成 AGENTS.md/README.md/DESIGN.md」「建立项目文档模板」「统一多项目文档结构」「写入 git/commit 规则」或新建项目需要配套规范文档时，应使用本 skill。
agent_created: true
---

# Project Scaffold

## Overview

把每个新项目都要重做一遍的元文档工作标准化：七份文档 = 固定骨架（共享层一次维护）+ 可变槽位（每项目填一次）。生成器填槽位并落盘，hook 做确定性校验，防止文档退化。

## 三层模型

- L1 共享层：`references/_SPEC.md`（结构真相源）+ `assets/templates/`（七份模板）+ 用户级共享指令。
- L2 项目实例层：生成的七份文档——根目录 `AGENTS.md` / `README.md` / `DESIGN.md`，`docs/` 下四份过程文档。
- L3 校验层：`.git/hooks/commit-msg` 与 `pre-commit`，由生成器安装。

原则：共享层只放跨项目不变量；项目特定值全部走槽位；确定性约束交给 hook，不靠指令自觉。

## 工作流

### Step 1: 确认目标与槽位

确定目标项目目录。收集槽位值，优先级从高到低：

1. `--set KEY=VALUE`（命令行，可重复）
2. `--config slots.json`（JSON 文件）
3. `--interactive`（交互逐项填写）
4. 默认值（`scripts/render.py` 的 `DEFAULT_SLOTS`；`PROJECT_NAME` 取目录名，`UPDATED` 取当天）

槽位含义与默认值见 `references/_SPEC.md` 的「槽位表」。信息不全时先用默认值生成，再让用户补，`TECH_STACK` / `COMMIT_SCOPES` / `ARCHITECTURE` 建议填。

### Step 2: 预演（推荐）

```bash
python ~/.workbuddy/skills/project-scaffold/scripts/init.py <target> --dry-run --set PROJECT_NAME=xxx
```

检查解析出的槽位是否符合预期。

### Step 3: 生成

```bash
python ~/.workbuddy/skills/project-scaffold/scripts/init.py <target> \
  --set TECH_STACK="React + TypeScript" --set PKG_MANAGER=pnpm
```

- 默认**不覆盖**已存在文件，只 skip，安全可重跑。
- `--force` 才覆盖，并把原文件备份到 `.scaffold-backup/<timestamp>/`。
- `--no-hooks` 可跳过 hook 安装（非 git 仓库会自动跳过）。
- 非 UI 项目生成后，可删除 `DESIGN.md`（并从 `_SPEC.md` 的 docs 中移除该项，避免校验失败）；或保留并用它记录配色/字体的项目约定。

### Step 4: 校验

```bash
python ~/.workbuddy/skills/project-scaffold/scripts/validate.py <target>
```

校验项：七份文档存在（按 spec 中的相对路径）、二级章节齐全、无残留 `{{SLOT}}`、hook 就位。退出码 0 表示通过。

### Step 5: 交付

告知用户生成了哪些文件、哪些被跳过、hook 是否安装、槽位是否需要补填。不要擅自提交或推送。

## 维护规范

- 改结构（章节/槽位/hook 列表）→ 先改 `references/_SPEC.md` 的 `ScaffoldSpec:v1` 块，再同步 `assets/templates/` 与 `scripts/render.py` 的 `DEFAULT_SLOTS`。
- 改文案 → 只改模板，不动 spec。
- 用户要求新增文档类型 → 在 spec 的 `docs` 加键，并在 `assets/templates/` 建同名模板。
- 用户要求改 hook 逻辑 → 改 `assets/hooks/*.tpl`，已安装的项目需重跑生成器（`--force`）才能更新。

## Resources

### scripts/
- `render.py`：spec 解析、槽位解析、模板渲染的公共逻辑。
- `init.py`：生成器，含 dry-run、覆盖备份、hook 安装。
- `validate.py`：校验器，供手动调用与 pre-commit hook 使用。

### references/
- `_SPEC.md`：单一真相源——三层模型、槽位表、机器可读结构块、校验规则。

### assets/templates/
- 根目录模板：`README.md`、`AGENTS.md`、`DESIGN.md`。
- `docs/` 子目录模板：`status.md`、`技术规范.md`、`开发环境.md`、`git规则.md`。
- 模板路径与 spec 中 `docs` 的键一一对应（含 `docs/` 前缀）。

### assets/hooks/
- `commit-msg.tpl`：conventional commits 格式校验。
- `pre-commit.tpl`：调用 validate.py 校验文档结构。
