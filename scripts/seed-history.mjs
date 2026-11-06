import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, activityForPaths, blameTimes, latestBlameTime, sectionsOf } from './lib/writeups.mjs';

const projects = '/home/aditya/Projects';
const repositories = {
  phase2: path.join(projects, 'Aditya_phase2'),
  tasks: path.join(projects, 'Tasks-Aditya'),
  kernel: path.join(projects, 'KernelCTF_TechTatva_26-27'),
};

function mapping(file) {
  if (file.startsWith('kernelCTF/')) return ['kernel', file.slice('kernelCTF/'.length)];
  if (file.startsWith('niteCTF/')) return ['phase2', file];
  if (file.startsWith('picoctf/')) return ['phase2', `picoctf/${path.basename(file)}`];
  if (file === 'MISC/AdventofCyber2025/AdventofCyber2025.md') return ['phase2', 'AdventofCyber2025/writeups.md'];
  if (file === 'MISC/Forensics/Forensics.md') return ['phase2', 'Custom_Challenges/Forensics.md'];
  if (file.startsWith('MISC/Forensics/') && file !== 'MISC/Forensics/forensics.md') {
    return ['phase2', `forensics_custom/steganography/${path.basename(file)}`];
  }
  if (file === 'MISC/binex/Binary_exploitation.md') return ['phase2', 'Custom_Challenges/Binary_exploitation.md'];
  if (file === 'MISC/hardware/hardware.md') return ['phase2', 'Custom_Challenges/hardware.md'];
  if (file.startsWith('MISC/binex/')) return ['tasks', `Intro-to-cybersec/${path.basename(file)}`];
  if (file.startsWith('MISC/Forensics/')) return ['tasks', `Intro-to-cybersec/${path.basename(file)}`];
  if (file.startsWith('MISC/')) return ['tasks', `Intro-to-cybersec/${path.basename(file)}`];
  return null;
}

function walk(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return walk(path.join(directory, entry.name), relative);
    if (!entry.name.endsWith('.md')) return [];
    if (relative.split('/').length > 3) return [];
    return [relative];
  });
}

const files = ['MISC', 'kernelCTF', 'niteCTF', 'picoctf'].flatMap((folder) => walk(path.join(ROOT, folder), folder));
const entries = {};
const sourcePaths = { phase2: new Set(), tasks: new Set(), kernel: new Set() };

for (const file of files) {
  const found = mapping(file);
  if (!found) continue;
  const [repoName, sourcePath] = found;
  const sourceFile = path.join(repositories[repoName], sourcePath);
  let sourceMarkdown;
  try { sourceMarkdown = readFileSync(sourceFile, 'utf8'); } catch { continue; }
  sourcePaths[repoName].add(sourcePath);
  const targetSections = sectionsOf(readFileSync(path.join(ROOT, file), 'utf8'), file);
  const sourceSections = sectionsOf(sourceMarkdown, sourcePath);
  const times = blameTimes(repositories[repoName], sourcePath);
  for (const target of targetSections) {
    const source = sourceSections.find((item) => item.titleKey === target.titleKey && item.occurrence === target.occurrence)
      || sourceSections[target.index];
    if (!source) continue;
    const updatedAt = latestBlameTime(times, source);
    if (updatedAt) entries[target.key] = { updatedAt, repository: repoName, sourcePath };
  }
}

const activity = {};
for (const [name, paths] of Object.entries(sourcePaths)) {
  const days = activityForPaths(repositories[name], [...paths]);
  for (const [day, count] of Object.entries(days)) activity[day] = (activity[day] || 0) + count;
}

mkdirSync(path.join(ROOT, 'history'), { recursive: true });
writeFileSync(path.join(ROOT, 'history/legacy.json'), `${JSON.stringify({ entries, activity }, null, 2)}\n`);
console.log(`Seeded ${Object.keys(entries).length} historical challenge dates.`);
