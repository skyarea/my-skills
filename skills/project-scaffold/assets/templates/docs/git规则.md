# {{PROJECT_NAME}} · Git 与 Commit 规则

> 原则写在这里，强制校验交给 `.git/hooks/` 下的 hook。

## 分支策略

标准 GitFlow。长期分支只有两条：

| 分支 | 角色 | 允许写入方式 |
| --- | --- | --- |
| `{{BRANCH_MAIN}}` | 稳定版本，打 tag | 只接 `release/*`、`hotfix/*` 合并 |
| `{{BRANCH_DEVELOP}}` | 集成分支，日常开发基线 | 只接 `feature/*`、`release/*`、`hotfix/*` 合并 |

短期分支（合并后删除）：

| 分支 | 从哪开 | 合到哪 | 用途 |
| --- | --- | --- | --- |
| `feature/<name>` | `{{BRANCH_DEVELOP}}` | `{{BRANCH_DEVELOP}}` | 新功能、改动、文档增量 |
| `release/<version>` | `{{BRANCH_DEVELOP}}` | `{{BRANCH_MAIN}}` + `{{BRANCH_DEVELOP}}` | 发版冻结、版本号与 changelog |
| `hotfix/<name>` | `{{BRANCH_MAIN}}` | `{{BRANCH_MAIN}}` + `{{BRANCH_DEVELOP}}` | 线上紧急修复 |

命名：小写字母、数字、连字符、斜杠；`<name>` 用 kebab-case。
禁止直接向 `{{BRANCH_MAIN}}` / `{{BRANCH_DEVELOP}}` push，禁止 force push。提交前先同步最新 `{{BRANCH_DEVELOP}}`（rebase 或 merge，按项目约定）。

## Commit 格式

```
<type>(<scope>): <subject>
```

- type：{{COMMIT_TYPES}}
- 标题：说清"改了什么"，祈使语气，不加句号。
- 正文：补"为什么"与"影响"；破坏性变更加 `BREAKING CHANGE:` 段。
- 一条 commit 只做一件事。

## Scope 词表

- 可用 scope：{{COMMIT_SCOPES}}
- 新增 scope 先更新本表再使用。

## 强制校验

- `commit-msg`：校验标题格式，不合格直接拒绝提交。
- `pre-commit`：调用 `.scaffold/scaffold.js` 校验七份文档章节齐全、无未填槽位（依赖 Node）。
- `pre-push`：禁止直推 `{{BRANCH_MAIN}}` / `{{BRANCH_DEVELOP}}`，非 GitFlow 分支名告警。
- Hook 与自包含校验器由生成器安装；升级后重跑生成器即可。
