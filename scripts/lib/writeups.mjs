import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const MIGRATION_COMMIT = '39570422e2942a3273fcd5d788668a28558736dc';
export const SITE_DIRS = new Set(['node_modules', 'src', 'scripts', 'tests', 'public', 'dist', 'history']);
const parser = unified().use(remarkParse).use(remarkGfm);

export function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

export function headingText(node) {
  return (node.children || []).map((child) => {
    if (typeof child.value === 'string') return child.value;
    return headingText(child);
  }).join('').trim();
}

export function normalizedTitle(title) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function sectionsOf(markdown, filePath) {
  const tree = parser.parse(markdown);
  const isAdvent = filePath.endsWith('AdventofCyber2025.md') || filePath.includes('AdventofCyber2025/');
  const headings = isAdvent ? [] : tree.children.filter((node) => node.type === 'heading' && node.depth === 1);
  const boundaries = headings.length ? headings : [null];
  const seen = new Map();
  return boundaries.map((node, index) => {
    const title = isAdvent ? 'Advent of Cyber 2025' : node ? headingText(node) : path.basename(filePath, '.md').replaceAll('_', ' ');
    const titleKey = normalizedTitle(title);
    const occurrence = seen.get(titleKey) || 0;
    seen.set(titleKey, occurrence + 1);
    const startOffset = node?.position?.start?.offset ?? 0;
    const endOffset = headings[index + 1]?.position?.start?.offset ?? markdown.length;
    const startLine = node?.position?.start?.line ?? 1;
    const endLine = (headings[index + 1]?.position?.start?.line ?? markdown.split('\n').length + 1) - 1;
    const body = markdown.slice(startOffset, endOffset).trim();
    const key = `${filePath}::${titleKey}::${occurrence}`;
    const id = createHash('sha256').update(key).digest('hex').slice(0, 12);
    const bodyTree = parser.parse(body);
    const paragraph = bodyTree.children.find((child) => child.type === 'paragraph');
    const excerpt = paragraph ? headingText(paragraph).replace(/\s+/g, ' ').slice(0, 190) : '';
    return { key, id, title, titleKey, occurrence, index, startLine, endLine, body, excerpt };
  }).filter((section) => section.body);
}

export function blameTimes(repo, relativePath) {
  const output = git(repo, ['blame', '--line-porcelain', '--', relativePath]);
  const times = [];
  let hash = '';
  let time = 0;
  for (const line of output.split('\n')) {
    const header = /^([0-9a-f]{40}) \d+ \d+(?: \d+)?$/.exec(line);
    if (header) hash = header[1];
    else if (line.startsWith('committer-time ')) time = Number(line.slice(15));
    else if (line.startsWith('\t')) times.push({ hash, time });
  }
  return times;
}

export function latestBlameTime(times, section, excludedHash = '') {
  let latest = 0;
  for (let line = section.startLine; line <= section.endLine; line++) {
    const entry = times[line - 1];
    if (entry && entry.hash !== excludedHash) latest = Math.max(latest, entry.time);
  }
  return latest ? new Date(latest * 1000).toISOString() : null;
}

export function dateInKolkata(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function activityForPaths(repo, paths, excludedHash = '') {
  if (!paths.length) return {};
  const output = git(repo, ['log', '--format=@@%H%x09%cI', '--name-only', '--', ...paths]);
  const days = {};
  for (const line of output.split('\n')) {
    if (!line.startsWith('@@')) continue;
    const [hash, committedAt] = line.slice(2).split('\t');
    if (hash === excludedHash || !committedAt) continue;
    const day = dateInKolkata(committedAt);
    days[day] = (days[day] || 0) + 1;
  }
  return days;
}

export function readLegacy() {
  return JSON.parse(readFileSync(path.join(ROOT, 'history/legacy.json'), 'utf8'));
}
