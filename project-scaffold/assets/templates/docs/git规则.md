# {{PROJECT_NAME}} · Git 与 Commit 规则

> 原则写在这里，强制校验交给 `.git/hooks/` 下的 hook。

## 分支策略

- 主分支：`{{BRANCH_MAIN}}`，只接合并，不直接提交。
- 功能分支：从主分支切 `feature/<name>`，完成合回。
- 发布/修复：`release/<version>`、`hotfix/<name>`（按需启用）。
- 提交前先同步最新主分支（rebase 或 merge，按项目约定）。

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
- `pre-commit`：校验六份文档章节齐全、无未填槽位。
- Hook 由生成器安装；不要手动改动，升级后重新运行生成器即可。
