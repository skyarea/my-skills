#!/usr/bin/env python3
"""Generate project meta-documents from templates and install git hooks.

Usage:
  python init.py <target-dir> [--config slots.json] [--set KEY=VALUE ...] [--interactive]
                [--no-hooks] [--force] [--dry-run]
"""
import argparse
import json
import os
import shutil
import stat
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render import (  # noqa: E402
    HOOK_DIR,
    TEMPLATE_DIR,
    check_residual,
    load_spec,
    render,
    resolve_slots,
)


def write_doc(target, name, content, force, backup_dir):
    path = target / name
    if path.exists() and not force:
        print(f"  skip  {name} (exists; use --force to overwrite)")
        return False
    if path.exists() and force:
        backup = backup_dir / name
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, backup)
        print(f"  backup {name} -> {backup}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  write {name}")
    return True


def install_hooks(target, slots, force, backup_dir):
    git_dir = target / ".git"
    if not git_dir.exists():
        print("  hooks skipped: not a git repository")
        return
    hooks_dir = git_dir / "hooks"
    hooks_dir.mkdir(parents=True, exist_ok=True)

    hook_values = dict(slots)
    hook_values["VALIDATOR"] = (Path(__file__).resolve().parent / "validate.py").as_posix()

    for hook_name in ("commit-msg", "pre-commit"):
        tpl = HOOK_DIR / f"{hook_name}.tpl"
        if not tpl.exists():
            print(f"  hooks skip {hook_name}: template missing")
            continue
        dest = hooks_dir / hook_name
        content = render(tpl.read_text(encoding="utf-8"), hook_values)
        if dest.exists() and not force:
            print(f"  hook skip  {hook_name} (exists; use --force)")
            continue
        if dest.exists():
            backup = backup_dir / f"hook-{hook_name}"
            shutil.copy2(dest, backup)
        dest.write_text(content, encoding="utf-8")
        dest.chmod(dest.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        print(f"  hook  {hook_name} installed")


def main():
    parser = argparse.ArgumentParser(description="初始化项目元规范文档集")
    parser.add_argument("target", nargs="?", default=".", help="目标项目目录")
    parser.add_argument("--config", help="槽位 JSON 文件")
    parser.add_argument("--set", action="append", dest="set_pairs", help="KEY=VALUE，可重复")
    parser.add_argument("--interactive", action="store_true", help="交互填写槽位")
    parser.add_argument("--no-hooks", action="store_true", help="不安装 git hooks")
    parser.add_argument("--force", action="store_true", help="覆盖已有文件并备份")
    parser.add_argument("--dry-run", action="store_true", help="只打印解析结果，不写文件")
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    if not target.is_dir():
        print(f"目标目录不存在: {target}", file=sys.stderr)
        return 2

    spec = load_spec()
    slots = resolve_slots(target, args.config, args.set_pairs, args.interactive)

    print(f"target: {target}")
    print("slots: " + json.dumps(slots, ensure_ascii=False))
    if args.dry_run:
        print("dry-run: no files written")
        return 0

    backup_dir = None
    if args.force:
        backup_dir = target / ".scaffold-backup" / datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_dir.mkdir(parents=True, exist_ok=True)

    target.mkdir(parents=True, exist_ok=True)
    written = 0
    for name in spec["docs"]:
        tpl = TEMPLATE_DIR / name
        if not tpl.exists():
            print(f"  ERROR missing template: {name}", file=sys.stderr)
            return 3
        content = render(tpl.read_text(encoding="utf-8"), slots)
        try:
            check_residual(content, name)
        except ValueError as exc:
            print(f"  ERROR {exc}", file=sys.stderr)
            return 4
        if write_doc(target, name, content, args.force, backup_dir or target):
            written += 1

    if not args.no_hooks:
        install_hooks(target, slots, args.force, backup_dir or target)

    print(f"done: {written} document(s) written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
