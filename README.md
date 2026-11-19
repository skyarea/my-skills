# my-skills

个人 Agent Skill 集中仓库。所有 skill 在此版本化、共享、跨机器同步。

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

## 安装方式（symlink）

skill 源码在仓库，WorkBuddy 从 `~/.workbuddy/skills/` 加载。用软链衔接，避免复制产生两份副本：

```bash
# 先设 MY_SKILLS 为实际克隆路径（按本机情况调整）
export MY_SKILLS="$HOME/GitSourceCode/my-skills"

# Windows (Git Bash) / macOS / Linux 通用
ln -s "$MY_SKILLS/<skill-name>" "$HOME/.workbuddy/skills/<skill-name>"
```

换机器后：clone 仓库 → 为每个 skill 重建软链 → 重启 agent。

## 新增 skill

1. 用 skill-creator 在仓库目录内初始化：`init_skill.py <name> --path "$MY_SKILLS"`
2. 删除示例文件，按 SKILL.md 规范填写 frontmatter（含 `agent_created: true`）与正文。
3. 执行 `quick_validate.py <skill-dir>` 校验结构。
4. 建软链到 `~/.workbuddy/skills/` 并重启 agent 验证触发。
5. commit & push。

## 通用化约定

- skill 内容（模板/规范/脚本）**不写死任何 IDE 工具名**（codebuddy / cursor / claude 等）；用「项目所用 AI 工具」等通用表述。
- 平台特定入口不复制主内容，只在各自配置里放指针引用本仓库 skill。
- 生成文档中的路径（validator、hook）用相对路径或生成时注入，不硬编码机器路径。
- 确定性约束交给 hook/脚本，指令只写原则。

## 维护

- 改 skill 结构 → 先改 `references/_SPEC.md`（若有），再同步模板与脚本。
- 改文案 → 只改模板。
- 推送前确认无机器特定路径残留。
