#!/usr/bin/env python3
"""Validate project meta-documents against _SPEC.md.

Usage:
  python validate.py <target-dir> [--json]

Exit 0 = all checks pass, 1 = violations found.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render import PLACEHOLDER_RE, load_spec  # noqa: E402


def validate(target):
    spec = load_spec()
    errors = []
    details = []

    for name, sections in spec["docs"].items():
        path = target / name
        if not path.exists():
            errors.append(f"缺失文档: {name}")
            continue
        text = path.read_text(encoding="utf-8")
        headings = set(re.findall(r"^##\s+(.+?)\s*$", text, re.M))
        for section in sections:
            if section not in headings:
                errors.append(f"{name} 缺少章节: ## {section}")
        leftovers = PLACEHOLDER_RE.findall(text)
        if leftovers:
            errors.append(f"{name} 存在未填槽位: {', '.join(leftovers)}")
        details.append({"doc": name, "sections": len(sections), "placeholders": leftovers})

    git_dir = target / ".git"
    if git_dir.is_dir():
        for hook in spec["hooks"]:
            hook_path = git_dir / "hooks" / hook
            if not hook_path.is_file():
                errors.append(f"缺失 hook: .git/hooks/{hook}")

    return {"ok": not errors, "errors": errors, "docs": details}


def main():
    parser = argparse.ArgumentParser(description="校验项目元规范文档")
    parser.add_argument("target", nargs="?", default=".", help="目标项目目录")
    parser.add_argument("--json", action="store_true", help="以 JSON 输出")
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    result = validate(target)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result["ok"]:
            print(f"OK: {len(result['docs'])} 份文档通过校验")
        else:
            print("FAIL:")
            for error in result["errors"]:
                print(f"  - {error}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
