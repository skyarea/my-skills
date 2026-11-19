#!/usr/bin/env python3
"""Shared helpers for project-scaffold: spec loading, slot resolution, rendering."""
import json
import re
import sys
from datetime import date
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SPEC_PATH = SKILL_DIR / "references" / "_SPEC.md"
TEMPLATE_DIR = SKILL_DIR / "assets" / "templates"
HOOK_DIR = SKILL_DIR / "assets" / "hooks"

SPEC_RE = re.compile(r"<!--\s*ScaffoldSpec:v1\s*(\{.*?\})\s*-->", re.S)
PLACEHOLDER_RE = re.compile(r"\{\{([A-Z_]+)\}\}")

DEFAULT_SLOTS = {
    "PROJECT_TYPE": "web",
    "TECH_STACK": "待填",
    "OWNER": "待填",
    "AGENT_RULE_REF": "用户级共享指令（中文回复 / 可靠性 / 安全 / 检索优先级 / commit 原则）",
    "BRAND_PRIMARY": "#3370FF",
    "PKG_MANAGER": "pnpm",
    "BUILD_CMD": "pnpm build",
    "TEST_CMD": "pnpm test",
    "LINT_CMD": "pnpm lint",
    "BRANCH_MAIN": "main",
    "COMMIT_TYPES": "feat | fix | docs | refactor | test | chore",
    "COMMIT_SCOPES": "待填",
    "PHASE": "需求",
}

PROMPTS = {
    "PROJECT_NAME": "项目名称",
    "PROJECT_TYPE": "项目类型 (web/app/lib/data/ml)",
    "TECH_STACK": "技术栈一句话",
    "OWNER": "负责人",
    "BRAND_PRIMARY": "品牌主色 (HEX)",
    "PKG_MANAGER": "包管理器 (pnpm/npm/pip/cargo)",
    "BUILD_CMD": "构建命令",
    "TEST_CMD": "测试命令",
    "LINT_CMD": "Lint 命令",
    "BRANCH_MAIN": "主分支名",
    "COMMIT_SCOPES": "commit scope 词表",
    "PHASE": "当前阶段",
}


def load_spec():
    text = SPEC_PATH.read_text(encoding="utf-8")
    match = SPEC_RE.search(text)
    if not match:
        raise ValueError("无法在 _SPEC.md 中找到 ScaffoldSpec:v1 结构块")
    return json.loads(match.group(1))


def resolve_slots(target, config_path=None, set_pairs=None, interactive=False):
    slots = dict(DEFAULT_SLOTS)
    slots["PROJECT_NAME"] = target.name
    slots["UPDATED"] = date.today().isoformat()

    if config_path:
        data = json.loads(Path(config_path).read_text(encoding="utf-8"))
        slots.update({k: str(v) for k, v in data.items()})

    for pair in set_pairs or []:
        if "=" not in pair:
            raise ValueError(f"--set 需要 KEY=VALUE 形式: {pair}")
        key, value = pair.split("=", 1)
        slots[key.strip()] = value.strip()

    if interactive:
        for key, label in PROMPTS.items():
            current = slots.get(key, "")
            answer = input(f"{label} [{current}]: ").strip()
            if answer:
                slots[key] = answer

    return slots


def render(text, slots):
    def repl(match):
        key = match.group(1)
        if key not in slots:
            raise ValueError(f"模板引用了未定义槽位: {key}")
        return str(slots[key])

    return PLACEHOLDER_RE.sub(repl, text)


def check_residual(text, doc_name):
    leftovers = PLACEHOLDER_RE.findall(text)
    if leftovers:
        raise ValueError(f"{doc_name} 仍有未填槽位: {', '.join(leftovers)}")
