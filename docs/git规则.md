# my-skills · Git 与 Commit 规则

> 原则写在这里，强制校验交给 `hooks/` 下可安装的脚本。
> 本仓库采用标准 GitFlow，远端主干为 `main`。

## 分支模型

长期分支只有两条：

| 分支 | 角色 | 允许写入方式 |
| --- | --- | --- |
| `main` | 稳定版本，打 tag | 只接 `release/*`、`hotfix/*` 合并 |
| `develop` | 集成分支，日常开发基线 | 只接 `feature/*`、`release/*`、`hotfix/*` 合并 |

短期分支（合并后删除）：

| 分支 | 从哪开 | 合到哪 | 用途 |
| --- | --- | --- | --- |
| `feature/<name>` | `develop` | `develop` | 新 skill、改 skill、文档增量 |
| `release/<version>` | `develop` | `main` + `develop` | 发版冻结、版本号与 changelog |
| `hotfix/<name>` | `main` | `main` + `develop` | 线上紧急修复 |

命名：小写字母、数字、连字符、斜杠；`<name>` 用 kebab-case，如 `feature/gitflow-guard`。

## 标准操作

```bash
# 1. 同步 develop 并开功能分支
git checkout develop
git pull --ff-only origin develop
git checkout -b feature/<name>

# 2. 开发 + 提交（conventional commit）
git add <files>
git commit -m "feat(skills): add gitflow guard hooks"

# 3. 同步最新 develop（推荐 rebase）
git fetch origin
git rebase origin/develop

# 4. 推送功能分支，开 PR 合回 develop
git push -u origin feature/<name>

# 5. 发版：develop -> release/x.y.z -> main + develop
# 6. 线上修复：main -> hotfix/<name> -> main + develop
```

一条 commit 只做一件事；标题说清「改了什么」，正文补「为什么」和「影响」。

## Commit 格式

```
<type>(<scope>): <subject>
```

- `type`：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore` / `revert`
- `scope`：可选，本仓库建议 `skills` / `docs` / `hooks` / `readme` / `agents` / `scaffold`
- `subject`：冒号后一个空格，祈使语气，说清改了什么，不加句号
- 破坏性变更加 `!`（如 `feat(skills)!: switch to skills/ layout`），正文写 `BREAKING CHANGE:`
- 新增 scope 先更新本表再使用

示例：

```
feat(skills): add gitflow guard hooks
fix(readme): correct skills layout path
docs(agents): document branch model
```

## 强制校验

安装一次，本地提交/推送自动生效（兼容 git worktree）：

```bash
bash hooks/install.sh
```

| hook | 触发 | 校验内容 |
| --- | --- | --- |
| `commit-msg` | `git commit` | 标题符合 Conventional Commits；不合规直接拒绝 |
| `pre-push` | `git push` | 禁止推送到 `main` / `develop`；非规范分支名告警 |

- hook 未安装不构成豁免。服务端 branch protection 才是最终防线。
- 首次创建 `develop`、服务端建分支等特殊场景可用 `--no-verify`，须在 PR 中说明原因。
- 升级/改动 hook 后重跑 `bash hooks/install.sh --force`。

## 禁止事项

- 直接向 `main` / `develop` push 或在上述分支直接 commit
- force push 到任何共享分支
- 未与用户确认就提交、推送、发 PR、删除或覆盖文件
- 绕过校验后不记录原因
