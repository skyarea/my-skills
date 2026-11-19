#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SKILL_DIR = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(SKILL_DIR, 'assets', 'templates');
const HOOK_DIR = path.join(SKILL_DIR, 'assets', 'hooks');

const SPEC_RE = /<!--\s*ScaffoldSpec:v1\s*([\s\S]*?)\s*-->/;
const PLACEHOLDER_RE = /\{\{([A-Z_]+)\}\}/g;

const DEFAULT_SLOTS = {
  PROJECT_TYPE: 'web',
  TECH_STACK: '待填',
  OWNER: '待填',
  AGENT_RULE_REF: '用户级共享指令（中文回复 / 可靠性 / 安全 / 检索优先级 / commit 原则）',
  BRAND_PRIMARY: '#3370FF',
  PKG_MANAGER: 'pnpm',
  BUILD_CMD: 'pnpm build',
  TEST_CMD: 'pnpm test',
  LINT_CMD: 'pnpm lint',
  BRANCH_MAIN: 'main',
  BRANCH_DEVELOP: 'develop',
  COMMIT_TYPES: 'feat | fix | docs | refactor | test | chore | perf | build | ci | style | revert',
  COMMIT_SCOPES: '待填',
  PHASE: '需求',
};

const PROMPTS = [
  ['PROJECT_NAME', '项目名称'],
  ['PROJECT_TYPE', '项目类型 (web/app/lib/data/ml)'],
  ['TECH_STACK', '技术栈一句话'],
  ['OWNER', '负责人'],
  ['BRAND_PRIMARY', '品牌主色 (HEX)'],
  ['PKG_MANAGER', '包管理器 (pnpm/npm/pip/cargo)'],
  ['BUILD_CMD', '构建命令'],
  ['TEST_CMD', '测试命令'],
  ['LINT_CMD', 'Lint 命令'],
  ['BRANCH_MAIN', '主分支名'],
  ['BRANCH_DEVELOP', '集成分支名'],
  ['COMMIT_SCOPES', 'commit scope 词表'],
  ['PHASE', '当前阶段'],
];

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function findSpecPath() {
  const local = path.join(__dirname, '_SPEC.md');
  if (fs.existsSync(local)) return local;
  return path.join(SKILL_DIR, 'references', '_SPEC.md');
}

function loadSpec(specPath = findSpecPath()) {
  const text = fs.readFileSync(specPath, 'utf8');
  const m = text.match(SPEC_RE);
  if (!m) throw new Error('无法在 _SPEC.md 中找到 ScaffoldSpec:v1 结构块');
  return JSON.parse(m[1]);
}

async function resolveSlots(target, opts) {
  const slots = { ...DEFAULT_SLOTS };
  slots.PROJECT_NAME = path.basename(target);
  slots.UPDATED = today();

  if (opts.config) {
    const data = JSON.parse(fs.readFileSync(path.resolve(opts.config), 'utf8'));
    for (const [k, v] of Object.entries(data)) slots[k] = String(v);
  }
  for (const pair of opts.set || []) {
    const i = pair.indexOf('=');
    if (i < 0) throw new Error(`--set 需要 KEY=VALUE 形式: ${pair}`);
    slots[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  if (opts.interactive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    for (const [key, label] of PROMPTS) {
      const answer = await new Promise((res) => rl.question(`${label} [${slots[key] || ''}]: `, res));
      if (answer.trim()) slots[key] = answer.trim();
    }
    rl.close();
  }
  slots.COMMIT_TYPES_RE = String(slots.COMMIT_TYPES)
    .split('|').map((s) => s.trim()).filter(Boolean).join('|');
  return slots;
}

function render(text, slots) {
  return text.replace(PLACEHOLDER_RE, (m, key) => {
    if (!(key in slots)) throw new Error(`模板引用了未定义槽位: ${key}`);
    return String(slots[key]);
  });
}

function checkResidual(text, doc) {
  const found = text.match(/\{\{([A-Z_]+)\}\}/g);
  if (found) throw new Error(`${doc} 仍有未填槽位: ${found.join(', ')}`);
}

function writeDoc(target, name, content, force, backupDir) {
  const p = path.join(target, name);
  if (fs.existsSync(p) && !force) {
    console.log(`  skip  ${name} (exists; use --force to overwrite)`);
    return false;
  }
  if (fs.existsSync(p) && force) {
    const backup = path.join(backupDir, name);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(p, backup);
    console.log(`  backup ${name} -> ${backup}`);
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log(`  write ${name}`);
  return true;
}

function findGitDir(target) {
  const dotgit = path.join(target, '.git');
  if (!fs.existsSync(dotgit)) return null;
  if (fs.statSync(dotgit).isDirectory()) return dotgit;
  const m = fs.readFileSync(dotgit, 'utf8').trim().match(/^gitdir:\s*(.+)$/);
  return m ? path.resolve(target, m[1]) : null;
}

function installHooks(target, slots, spec, force, backupDir) {
  const gitDir = findGitDir(target);
  if (!gitDir) {
    console.log('  hooks skipped: not a git repository');
    return;
  }
  const hooksDir = path.join(gitDir, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });

  const scaffoldDir = path.join(target, '.scaffold');
  fs.mkdirSync(scaffoldDir, { recursive: true });
  fs.copyFileSync(__filename, path.join(scaffoldDir, 'scaffold.js'));
  fs.copyFileSync(findSpecPath(), path.join(scaffoldDir, '_SPEC.md'));
  console.log('  scaffold copied -> .scaffold/ (self-contained validator)');

  for (const name of spec.hooks) {
    const tpl = path.join(HOOK_DIR, `${name}.tpl`);
    if (!fs.existsSync(tpl)) {
      console.log(`  hooks skip ${name}: template missing`);
      continue;
    }
    const dest = path.join(hooksDir, name);
    const content = render(fs.readFileSync(tpl, 'utf8'), slots);
    if (fs.existsSync(dest) && !force) {
      console.log(`  hook skip  ${name} (exists; use --force)`);
      continue;
    }
    if (fs.existsSync(dest)) fs.copyFileSync(dest, path.join(backupDir, `hook-${name}`));
    fs.writeFileSync(dest, content, 'utf8');
    fs.chmodSync(dest, fs.statSync(dest).mode | 0o111);
    console.log(`  hook  ${name} installed`);
  }
}

function validate(target) {
  const spec = loadSpec();
  const errors = [];
  const details = [];
  for (const [name, sections] of Object.entries(spec.docs)) {
    const p = path.join(target, name);
    if (!fs.existsSync(p)) {
      errors.push(`缺失文档: ${name}`);
      continue;
    }
    const text = fs.readFileSync(p, 'utf8');
    const headings = new Set([...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]));
    for (const s of sections) {
      if (!headings.has(s)) errors.push(`${name} 缺少章节: ## ${s}`);
    }
    const leftovers = [...text.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]);
    if (leftovers.length) errors.push(`${name} 存在未填槽位: ${leftovers.join(', ')}`);
    details.push({ doc: name, sections: sections.length, placeholders: leftovers });
  }
  const gitDir = findGitDir(target);
  if (gitDir) {
    for (const hook of spec.hooks) {
      if (!fs.existsSync(path.join(gitDir, 'hooks', hook))) errors.push(`缺失 hook: .git/hooks/${hook}`);
    }
  }
  return { ok: errors.length === 0, errors, docs: details };
}

function parseArgs(argv) {
  if (!argv.length || argv[0].startsWith('-')) argv.unshift('init');
  const cmd = argv[0];
  const opts = { set: [] };
  let target = '.';
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') opts.force = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--no-hooks') opts.noHooks = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--interactive') opts.interactive = true;
    else if (a === '--config') opts.config = argv[++i];
    else if (a === '--set') opts.set.push(argv[++i]);
    else if (a.startsWith('-')) throw new Error(`未知选项: ${a}`);
    else target = a;
  }
  return { cmd, target, opts };
}

async function main() {
  const { cmd, target: targetArg, opts } = parseArgs(process.argv.slice(2));
  const target = path.resolve(targetArg);

  if (cmd === 'validate') {
    const result = validate(target);
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else if (result.ok) console.log(`OK: ${result.docs.length} 份文档通过校验`);
    else {
      console.log('FAIL:');
      for (const e of result.errors) console.log(`  - ${e}`);
    }
    return result.ok ? 0 : 1;
  }

  if (cmd !== 'init') throw new Error(`未知命令: ${cmd}`);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    console.error(`目标目录不存在: ${target}`);
    return 2;
  }

  const spec = loadSpec();
  const slots = await resolveSlots(target, opts);
  console.log(`target: ${target}`);
  console.log('slots: ' + JSON.stringify(slots));
  if (opts.dryRun) {
    console.log('dry-run: no files written');
    return 0;
  }

  const backupDir = opts.force ? path.join(target, '.scaffold-backup', timestamp()) : null;
  if (backupDir) fs.mkdirSync(backupDir, { recursive: true });

  let written = 0;
  for (const name of Object.keys(spec.docs)) {
    const tpl = path.join(TEMPLATE_DIR, name);
    if (!fs.existsSync(tpl)) {
      console.error(`  ERROR missing template: ${name}`);
      return 3;
    }
    let content;
    try {
      content = render(fs.readFileSync(tpl, 'utf8'), slots);
      checkResidual(content, name);
    } catch (e) {
      console.error(`  ERROR ${e.message}`);
      return 4;
    }
    if (writeDoc(target, name, content, opts.force, backupDir || target)) written++;
  }

  if (!opts.noHooks) installHooks(target, slots, spec, opts.force, backupDir || target);
  console.log(`done: ${written} document(s) written`);
  return 0;
}

main().then((code) => process.exit(code || 0)).catch((e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});
