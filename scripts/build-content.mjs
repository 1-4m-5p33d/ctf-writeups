import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { ROOT, SITE_DIRS, MIGRATION_COMMIT, activityForPaths, blameTimes, git, latestBlameTime, readLegacy, sectionsOf } from './lib/writeups.mjs';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);
const SUPPORT_DIRS = new Set(['challenge', 'actual_chall', 'actual_challenge']);
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const assetRoot = path.join(ROOT, 'public/content-assets');
rmSync(assetRoot, { recursive: true, force: true });
const origin = git(ROOT, ['remote', 'get-url', 'origin']).trim();
const originMatch = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(origin);
const currentRepository = process.env.GITHUB_REPOSITORY || originMatch?.[1] || `1-4m-5p33d/${path.basename(ROOT)}`;
const currentRepoUrl = `https://github.com/${currentRepository}`;
const currentBranch = process.env.GITHUB_REF_NAME || git(ROOT, ['branch', '--show-current']).trim() || 'main';

function githubFolderUrl(file) {
  const directory = path.posix.dirname(file);
  return `${currentRepoUrl}/tree/${encodeURIComponent(currentBranch)}/${directory.split('/').map(encodeURIComponent).join('/')}`;
}

function contentFolders() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !SITE_DIRS.has(entry.name))
    .map((entry) => entry.name);
}

function filesIn(directory, prefix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      if (SUPPORT_DIRS.has(entry.name)) return [];
      return filesIn(path.join(directory, entry.name), relative);
    }
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) return [];
    if (entry.name.toLowerCase() === 'readme.md' && relative.split('/').length !== 3) return [];
    return [relative];
  });
}

function copyImages(directory, prefix) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) copyImages(source, relative);
    else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const target = path.join(assetRoot, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(source, target);
    }
  }
}

function localImageUrl(url, sourcePath) {
  if (!url || /^(https?:|data:|blob:|\/\/)/i.test(url)) return url;
  const [pathname, suffix = ''] = url.split(/(?=[?#])/u, 2);
  const normalized = pathname.startsWith('/images/')
    ? path.posix.join('MISC', pathname.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), pathname));
  if (normalized.startsWith('../') || !IMAGE_EXTENSIONS.has(path.extname(normalized).toLowerCase())) return url;
  if (!existsSync(path.join(ROOT, normalized))) return url;
  return `${base}/content-assets/${normalized.split('/').map(encodeURIComponent).join('/')}${suffix}`;
}

function rewriteImages(sourcePath) {
  return (tree) => visit(tree, 'element', (node) => {
    if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
      node.properties.src = localImageUrl(node.properties.src, sourcePath);
      node.properties.loading = 'lazy';
    }
  });
}

const renderer = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw).use(rehypeSanitize).use(rehypeStringify);

async function render(markdown, sourcePath) {
  const processor = renderer().use(rewriteImages, sourcePath);
  return String(await processor.process(markdown));
}

const legacy = readLegacy();
const folders = contentFolders();
const files = folders.flatMap((folder) => filesIn(path.join(ROOT, folder), folder));
const currentActivity = activityForPaths(ROOT, files, MIGRATION_COMMIT);
const activity = { ...legacy.activity };
for (const [day, count] of Object.entries(currentActivity)) activity[day] = (activity[day] || 0) + count;
const items = [];

for (const file of files) {
  const markdown = readFileSync(path.join(ROOT, file), 'utf8');
  const lineTimes = blameTimes(ROOT, file);
  for (const section of sectionsOf(markdown, file)) {
    const historical = legacy.entries[section.key];
    const current = latestBlameTime(lineTimes, section, MIGRATION_COMMIT);
    const updatedAt = current && (!historical || current > historical.updatedAt)
      ? current
      : historical?.updatedAt || current || statSync(path.join(ROOT, file)).mtime.toISOString();
    items.push({
      id: section.id,
      title: section.title,
      folder: file.split('/')[0],
      path: file,
      filesUrl: githubFolderUrl(file),
      updatedAt,
      excerpt: section.excerpt,
      html: await render(section.body, file),
    });
  }
}

items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title));
for (const folder of folders) copyImages(path.join(ROOT, folder), folder);
mkdirSync(path.join(ROOT, '.generated'), { recursive: true });
writeFileSync(path.join(ROOT, '.generated/writeups.json'), `${JSON.stringify({ items, folders: folders.filter((folder) => items.some((item) => item.folder === folder)), activity })}\n`);
console.log(`Built ${items.length} writeups from ${files.length} Markdown files in ${folders.length} folders.`);
