# my-skills

个人 Agent Skill 集中仓库。所有 skill 在此版本化与分享；安装通过 `npx skills` 完成。

## 结构

```
my-skills/
├── README.md
└── <skill-name>/
    ├── SKILL.md          # skill 入口：触发条件 + 工作流
    ├── references/       # 按需加载的规范/文档
    ├── scripts/          # 可执行脚本（确定性任务）
    └── assets/           # 模板、hook、图片等输出资源
```

每个 skill 遵循标准 Agent Skill 格式（YAML frontmatter + Markdown 正文），可被 WorkBuddy、Claude Code 等原生读取。

## 现有 skill

| skill | 用途 |
| --- | --- |
| `project-scaffold` | 新项目一键生成元规范文档集（AGENTS/README/DESIGN + docs/ 四份）并安装 git hook |

## 安装

本仓库只是源码维护（版本控制 + 分享）。安装交给 [`npx skills`](https://github.com/vercel-labs/skills) CLI，它会自动发现仓库里的 skill 并链接到各 agent 的 skills 目录。

```bash
# 安装全部 skill（全局，对所有项目可用）
npx skills@latest add skyarea/my-skills -g -y

# 只装某个 skill
npx skills@latest add skyarea/my-skills --skill project-scaffold -g -y

# 本地源码自测（不推远端也能试）
npx skills@latest add . --skill project-scaffold

# 其他常用
npx skills list          # 查看已装
npx skills check         # 检查上游更新
npx skills update        # 拉最新版本
```

默认用 symlink 链接到单一副本，更新一次全部生效；不支持软链的环境加 `--copy` 改为复制。CLI 会处理各 agent 的路径解析，无需手动建链。

## 新增 skill

1. 在仓库根目录建 `<skill-name>/` 目录，内含 `SKILL.md`（标准 frontmatter：`name` 与目录名一致）+ 可选 `scripts/`、`references/`、`assets/`。
2. 用 `npx skills add . --skill <name>` 本地自测。
3. `npx skills-ref validate ./<skill-name>` 校验格式。
4. commit & push。用户即可通过 `npx skills add skyarea/my-skills` 安装。

## 通用化约定

- skill 内容（模板/规范/脚本）**不写死任何 IDE 工具名**（codebuddy / cursor / claude 等）；用「项目所用 AI 工具」等通用表述。
- 平台特定入口不复制主内容，只在各自配置里放指针引用本仓库 skill。
- 生成文档中的路径（validator、hook）用相对路径或生成时注入，不硬编码机器路径。
- 确定性约束交给 hook/脚本，指令只写原则。

## 维护

- 改 skill 结构 → 先改 `references/_SPEC.md`（若有），再同步模板与脚本。
- 改文案 → 只改模板。
- 推送前确认无机器特定路径残留。
