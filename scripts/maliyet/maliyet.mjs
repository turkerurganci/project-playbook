#!/usr/bin/env node
// Cost estimator for Claude Code sessions, computed client-side from the local
// session transcripts (~/.claude/projects/<project-dir>/*.jsonl and
// <session-id>/subagents/*.jsonl). No dependencies, Node 18+.
// The transcript format is NOT an official contract; see README.md.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Price table, USD per million tokens (MTok).
// Source: https://platform.claude.com/docs/en/about-claude/pricing
// Fields: in = fresh input, w5m = 5-minute cache write, w1h = 1-hour cache write,
//         read = cache read, out = output.
// `match` is tested against message.model (lowercased).
// Haiku 5.5 has two tiers chosen per message by context size
// (context = input + cache_read + cache_creation of that message).
// ---------------------------------------------------------------------------
const PRICES = [
  { name: 'Opus 5.5', match: /opus-5-5/, in: 4, w5m: 5, w1h: 8, read: 0.2, out: 20 },
  { name: 'Sonnet 5.5', match: /sonnet-5-5/, in: 2, w5m: 2.5, w1h: 4, read: 0.1, out: 10 },
  {
    name: 'Haiku 5.5', match: /haiku-5-5/, tierAt: 100_000,
    low: { in: 0.1, w5m: 0.125, w1h: 0.2, read: 0.01, out: 0.5 },
    high: { in: 0.5, w5m: 0.625, w1h: 1, read: 0.05, out: 2.5 },
  },
  // Fable 5.1: from the official pricing page above, not from secondary sources.
  { name: 'Fable 5.1', match: /fable-5-1/, in: 10, w5m: 12.5, w1h: 20, read: 0.25, out: 50 },
];

const STEPS = ['/audit', '/deep-review', '/cross-review', '/checkpoint', '/task', '/validate', '/gate-check', '/handoff'];
const OTHER = 'diğer';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { dir: null, since: null, json: false, out: null, help: false };
  const val = (i) => (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined);
  // --dir and --since need a value; --out's file name is optional, but an
  // explicitly empty one (--out "") is an error, not the default path.
  const need = (i) => {
    const v = val(i);
    if (v === undefined || v === '') { console.error(`${argv[i]} bir değer ister`); process.exit(2); }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--dir') a.dir = need(i++);
    else if (k === '--since') a.since = need(i++);
    else if (k === '--json') a.json = true;
    else if (k === '--out') {
      const v = val(i);
      if (v === '') { console.error('--out boş dosya adı alamaz; varsayılan için yalnız --out yazın'); process.exit(2); }
      a.out = v ?? ''; if (v !== undefined) i++;
    }
    else if (k === '-h' || k === '--help') a.help = true;
    else { console.error(`Bilinmeyen argüman: ${k}`); process.exit(2); }
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('Kullanım: node maliyet.mjs [--dir <proje-kayıt-klasörü>] [--since YYYY-MM-DD] [--json] [--out [dosya]]\n' +
    'Varsayılan: yalnız stdout. --out dosya adı olmadan verilirse .metrics/maliyet-<tarih>.md yazılır.');
  process.exit(0);
}
if (args.since && !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
  console.error('--since YYYY-MM-DD biçiminde olmalı'); process.exit(2);
}

// Derive the transcript folder name from the repo path: every character other
// than letters/digits becomes '-' (C:\Projects\x -> C--Projects-x).
function projectDirName(p) { return p.replace(/[^A-Za-z0-9]/g, '-'); }

function resolveDir() {
  if (args.dir) return path.resolve(args.dir);
  const base = path.join(os.homedir(), '.claude', 'projects');
  const name = projectDirName(process.cwd());
  const exact = path.join(base, name);
  if (fs.existsSync(exact)) return exact;
  // Case-insensitive fallback (drive letter / folder case differs between tools).
  if (fs.existsSync(base)) {
    const hit = fs.readdirSync(base).find((d) => d.toLowerCase() === name.toLowerCase());
    if (hit) return path.join(base, hit);
  }
  console.error(`Kayıt klasörü bulunamadı: ${exact}\n--dir ile elle verin.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------
const warnings = new Set();

function priceOf(model, ctx) {
  const m = PRICES.find((p) => p.match.test(model.toLowerCase()));
  if (!m) return null;
  return m.tierAt ? (ctx > m.tierAt ? m.high : m.low) : m;
}

// The transcript's usage field names are read only here; the rest of the
// script uses the short names. Missing fields count as 0.
function normUsage(u) {
  const {
    input_tokens: inTok,
    output_tokens: outTok,
    cache_read_input_tokens: rdTok,
    cache_creation_input_tokens: ccTok,
  } = u;
  const {
    ephemeral_5m_input_tokens: w5mTok,
    ephemeral_1h_input_tokens: w1hTok,
  } = u.cache_creation ?? {};
  return {
    inTok: inTok || 0, outTok: outTok || 0, cacheReadTok: rdTok || 0, cacheWriteTok: ccTok || 0,
    w5mTok: w5mTok || 0, w1hTok: w1hTok || 0,
  };
}

const ctxOf = (n) => n.inTok + n.cacheReadTok + n.cacheWriteTok;

function costOf(model, u) {
  const n = normUsage(u);
  const p = priceOf(model, ctxOf(n));
  if (!p) { warnings.add(`Bilinmeyen model, fiyatsız: ${model}`); return null; }
  // Cache writes not covered by the 5m/1h breakdown (breakdown missing or
  // smaller than the total) are priced as 5-minute writes.
  const t1h = n.w1hTok;
  const t5m = n.w5mTok + Math.max(0, n.cacheWriteTok - n.w5mTok - n.w1hTok);
  return (n.inTok * p.in + t5m * p.w5m + t1h * p.w1h + n.cacheReadTok * p.read + n.outTok * p.out) / 1e6;
}

// ---------------------------------------------------------------------------
// Transcript parsing
// ---------------------------------------------------------------------------
function readLines(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* truncated/partial line */ }
  }
  return out;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((b) => b?.type === 'text').map((b) => b.text).join('\n');
  return '';
}

function detectStep(text) {
  let best = null, bestIdx = Infinity;
  for (const s of STEPS) {
    const re = new RegExp(`(^|[\\s>"'(])${s.replace('/', '\\/')}(?![\\w-])`);
    const m = re.exec(text);
    if (m && m.index < bestIdx) { best = s; bestIdx = m.index; }
  }
  return best ?? OTHER;
}

function detectTarget(text) {
  const ids = new Set();
  for (const m of text.matchAll(/\bT\d{2,3}\b/g)) ids.add(m[0]);
  for (const m of text.matchAll(/\b(?:belge|doc)[\s#:-]*(\d{1,3})\b/gi)) ids.add(`Belge ${m[1]}`);
  return [...ids].slice(0, 4).join(', ') || '-';
}

const usageSum = (u) => { const n = normUsage(u); return ctxOf(n) + n.outTok; };

// Per message.id keep the entry with the largest usage (streamed duplicates
// repeat the same or a growing usage). Dedupe is also global across sessions.
function collectSession(file, seen) {
  const sessionId = path.basename(file, '.jsonl');
  const subDir = path.join(path.dirname(file), sessionId, 'subagents');
  const files = [{ f: file, sub: false }];
  if (fs.existsSync(subDir)) {
    for (const n of fs.readdirSync(subDir)) if (n.endsWith('.jsonl')) files.push({ f: path.join(subDir, n), sub: true });
  }
  const msgs = new Map(); // id -> {model, usage, sub, ts}
  let firstUser = null, firstTs = null, clientCost = null;
  for (const { f, sub } of files) {
    for (const o of readLines(f)) {
      if (!sub && o.timestamp && (!firstTs || o.timestamp < firstTs)) firstTs = o.timestamp;
      if (!sub && o.type === 'user' && firstUser === null && !o.isMeta && !o.isSidechain) {
        const t = textOf(o.message?.content);
        if (t.trim()) firstUser = t;
      }
      if (!sub && o.type === 'cost-state' && typeof o.totalCostUSD === 'number') clientCost = o.totalCostUSD;
      if (o.type !== 'assistant' || !o.message?.usage || !o.message.model || o.message.model === '<synthetic>') continue;
      const id = o.message.id || o.uuid;
      const prev = msgs.get(id);
      if (!prev || usageSum(o.message.usage) >= usageSum(prev.usage)) {
        msgs.set(id, { model: o.message.model, usage: o.message.usage, sub: sub || !!o.isSidechain, ts: o.timestamp });
      }
    }
  }
  const mine = [];
  for (const [id, m] of msgs) {
    if (seen.has(id)) continue;
    seen.add(id);
    mine.push(m);
  }
  if (!mine.length) return null;

  const s = {
    session: sessionId.slice(0, 8), sessionId,
    date: (firstTs || mine[0].ts || '').slice(0, 10),
    step: detectStep(firstUser || ''), target: detectTarget(firstUser || ''),
    models: {}, input: 0, read: 0, write: 0, output: 0,
    cost: 0, costMain: 0, costSub: 0, unpriced: 0, maxCtx: 0, clientCost, messages: mine.length,
  };
  for (const m of mine) {
    const u = m.usage;
    const c = costOf(m.model, u);
    const n = normUsage(u);
    const ctx = ctxOf(n);
    const mm = (s.models[m.model] ??= { cost: 0, n: 0, unpriced: 0 });
    mm.n++;
    s.input += n.inTok; s.read += n.cacheReadTok;
    s.write += n.cacheWriteTok; s.output += n.outTok;
    if (!m.sub) s.maxCtx = Math.max(s.maxCtx, ctx);
    if (c === null) { mm.unpriced++; s.unpriced++; continue; }
    mm.cost += c; s.cost += c;
    if (m.sub) s.costSub += c; else s.costMain += c;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const dir = resolveDir();
if (!fs.existsSync(dir)) { console.error(`Klasör yok: ${dir}`); process.exit(1); }
const seen = new Set();
const sessions = [];
const topFiles = fs.readdirSync(dir).filter((n) => n.endsWith('.jsonl'))
  .map((n) => path.join(dir, n))
  .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
for (const f of topFiles) {
  const s = collectSession(f, seen);
  if (s && (!args.since || s.date >= args.since)) sessions.push(s);
}
sessions.sort((a, b) => a.date.localeCompare(b.date));

const byStep = {};
for (const s of sessions) {
  const t = (byStep[s.step] ??= { step: s.step, sessions: 0, cost: 0, read: 0, write: 0, output: 0, unpriced: 0 });
  t.sessions++; t.cost += s.cost; t.read += s.read; t.write += s.write; t.output += s.output; t.unpriced += s.unpriced;
}
const total = sessions.reduce((a, s) => a + s.cost, 0);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
const usd = (n) => `$${n.toFixed(2)}`;
const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
const share = (s) => (s.cost ? `${Math.round((100 * s.costMain) / s.cost)}/${Math.round((100 * s.costSub) / s.cost)}` : '-');
const modelCell = (s) => Object.entries(s.models)
  .map(([m, v]) => `${m.replace(/^claude-/, '')}: ${usd(v.cost)}${v.unpriced ? ' (fiyatsız)' : ''}`).join('; ');

function renderMd() {
  const L = [];
  L.push('# Maliyet raporu');
  L.push('');
  L.push("> İstemci tarafı tahmin; kesin fatura Console'da. Kayıtlardan hesaplanır, resmî sözleşme değildir. Kalite göstergeleriyle birlikte okuyun.");
  L.push('');
  L.push(`- Kayıt klasörü: \`${dir}\``);
  L.push(`- Oluşturulma: ${new Date().toISOString().slice(0, 10)}${args.since ? `, başlangıç: ${args.since}` : ''}`);
  L.push(`- Oturum: ${sessions.length}, toplam tahmini maliyet: **${usd(total)}**`);
  for (const w of warnings) L.push(`- UYARI: ${w}`);
  L.push('');
  L.push('## Adım türüne göre toplam');
  L.push('');
  L.push('| Adım | Oturum | Okuma (cache) | Yazma (cache) | Çıktı | Tahmini $ | Pay % |');
  L.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const t of Object.values(byStep).sort((a, b) => b.cost - a.cost)) {
    L.push(`| ${t.step} | ${t.sessions} | ${k(t.read)} | ${k(t.write)} | ${k(t.output)} | ${usd(t.cost)} | ${total ? Math.round((100 * t.cost) / total) : 0} |`);
  }
  L.push('');
  L.push('## Oturumlar');
  L.push('');
  L.push('| Tarih | Oturum | Adım | Hedef | Model kırılımı | Okuma (cache) | Yazma (cache) | Çıktı | Tahmini $ | Ana/Alt % | En yüksek bağlam | İstemci $ |');
  L.push('|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const s of sessions) {
    L.push(`| ${s.date} | ${s.session} | ${s.step} | ${s.target} | ${modelCell(s)} | ${k(s.read)} | ${k(s.write)} | ${k(s.output)} | ${usd(s.cost)} | ${share(s)} | ${k(s.maxCtx)} | ${s.clientCost == null ? '-' : usd(s.clientCost)} |`);
  }
  L.push('');
  L.push('Not: "Ana/Alt %" ana ajan / alt ajan maliyet payıdır. "İstemci $" oturumdaki son `cost-state` kaydıdır (varsa); kümülatif olabilir, yalnız karşılaştırma içindir.');
  return L.join('\n') + '\n';
}

const outText = args.json
  ? JSON.stringify({ note: "istemci tarafı tahmin; kesin fatura Console'da", dir, total, warnings: [...warnings], byStep: Object.values(byStep), sessions }, null, 2) + '\n'
  : renderMd();

if (args.out !== null) {
  const target = args.out || path.join('.metrics', `maliyet-${new Date().toISOString().slice(0, 10)}.${args.json ? 'json' : 'md'}`);
  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(target, outText);
  console.error(`Yazıldı: ${target}`);
} else {
  process.stdout.write(outText);
}
