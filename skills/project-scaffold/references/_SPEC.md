# 项目元规范 · 单一真相源

> 本文件定义七份项目文档的章节结构、槽位表与校验规则。模板与校验器都从本文件派生。
> 改规范只改这里，然后同步 `assets/templates/` 下对应模板。

## 三层模型

| 层 | 内容 | 位置 | 维护频率 |
| --- | --- | --- | --- |
| L1 共享层 | 本 spec + 七份模板 + 共享指令 | 用户级 skill | 一次维护，跨项目复用 |
| L2 项目实例层 | 生成的七份文档 | 项目根目录 + `docs/` | 每项目填一次槽位 |
| L3 校验层 | commit-msg / pre-commit / pre-push hook | 项目 `.git/hooks/` | 自动生成，强制生效 |

## 文档布局

- 根目录只放入口文档：`AGENTS.md`、`README.md`、`DESIGN.md`。
- 过程文档归 `docs/`：`status.md`、`技术规范.md`、`开发环境.md`、`git规则.md`。
- 机器可读结构块的键即相对路径，生成器与校验器据此定位模板与目标文件。

## 槽位表

| 槽位 | 含义 | 默认值 | 必填 |
| --- | --- | --- | --- |
| `PROJECT_NAME` | 项目名称 | 目标目录名 | 自动推导 |
| `PROJECT_TYPE` | 项目类型 | `web` | 否 |
| `TECH_STACK` | 技术栈一句话 | `待填` | 建议填 |
| `OWNER` | 负责人 | `待填` | 否 |
| `AGENT_RULE_REF` | 跨项目共享规则源 | 用户级共享指令 | 否 |
| `BRAND_PRIMARY` | 品牌主色 | `#3370FF` | 否 |
| `PKG_MANAGER` | 包管理器 | `pnpm` | 否 |
| `BUILD_CMD` | 构建命令 | `pnpm build` | 否 |
| `TEST_CMD` | 测试命令 | `pnpm test` | 否 |
| `LINT_CMD` | lint 命令 | `pnpm lint` | 否 |
| `BRANCH_MAIN` | 主分支名（稳定版，打 tag） | `main` | 否 |
| `BRANCH_DEVELOP` | 集成分支名（日常开发基线） | `develop` | 否 |
| `COMMIT_TYPES` | commit type 词表（展示用） | feat/fix/docs/... | 否 |
| `COMMIT_TYPES_RE` | commit type 正则词表（hook 用） | 由 `COMMIT_TYPES` 自动派生 | 自动 |
| `COMMIT_SCOPES` | commit scope 词表 | `待填` | 建议填 |
| `PHASE` | 当前阶段 | `需求` | 否 |
| `ARCHITECTURE` | 一句话架构 | `待填` | 建议填 |
| `UPDATED` | 更新日期 | 生成当天 | 自动 |

## 文档结构（机器可读）

<!-- ScaffoldSpec:v1
{
  "docs": {
    "README.md": ["项目简介", "快速开始", "文档导航", "目录结构"],
    "AGENTS.md": ["项目速览", "文档索引", "执行契约", "护栏"],
    "DESIGN.md": ["颜色令牌", "字体", "间距与形状", "组件", "护栏"],
    "docs/status.md": ["当前阶段", "进度", "阻塞", "下一步", "更新时间"],
    "docs/技术规范.md": ["架构", "技术栈", "分层与依赖", "接口约定", "测试策略"],
    "docs/开发环境.md": ["前置依赖", "安装", "配置", "常用命令", "排错"],
    "docs/git规则.md": ["分支策略", "Commit 格式", "Scope 词表", "强制校验"]
  },
  "required_slots": ["PROJECT_NAME"],
  "hooks": ["commit-msg", "pre-commit", "pre-push"]
}
-->

## 校验规则

1. 七份文档必须存在（路径见结构块）。
2. 每份文档必须包含上表列出的全部 `##` 二级章节，标题文字精确匹配。
3. 文档中不得残留 `{{SLOT}}` 形式的未填槽位。
4. Git 仓库中 `commit-msg`、`pre-commit`、`pre-push` hook 必须存在。
5. 确定性约束交给 hook；指令只写原则，不冒充强制手段。

## 设计原则

- **骨架通用、槽位可变**：章节结构是跨项目不变量，具体值才是变量。
- **AGENTS.md 保持短**：只做索引与路由，细节下沉到专门文档。
- **DESIGN.md 是视觉唯一真相源**：代码只引用令牌名，不写裸值。
- **覆盖需确认**：生成器默认跳过已存在文件；`--force` 才覆盖并备份 hook。
