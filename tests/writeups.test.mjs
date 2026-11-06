import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateInKolkata, latestBlameTime, sectionsOf } from '../scripts/lib/writeups.mjs';

test('splits challenges without treating headings in code fences as entries', () => {
  const markdown = '# First\n\nA solution.\n\n```sh\n# a shell comment\n```\n\n# Second\n\nAnother solution.\n';
  const sections = sectionsOf(markdown, 'picoctf/example.md');
  assert.deepEqual(sections.map((section) => section.title), ['First', 'Second']);
  assert.match(sections[0].body, /# a shell comment/);
  assert.doesNotMatch(sections[0].body, /Another solution/);
});

test('keeps all Advent days together as one writeup', () => {
  const sections = sectionsOf('# Day 20\n\nSolution\n\n## Day 21\n\nNext solution\n', 'MISC/AdventofCyber2025/AdventofCyber2025.md');
  assert.deepEqual(sections.map((section) => section.title), ['Advent of Cyber 2025']);
  assert.match(sections[0].body, /Next solution/);
});

test('uses the latest changed line in a challenge and ignores the migration commit', () => {
  const times = [
    { hash: 'old', time: 100 },
    { hash: 'migration', time: 500 },
    { hash: 'new', time: 300 },
  ];
  assert.equal(latestBlameTime(times, { startLine: 1, endLine: 3 }, 'migration'), new Date(300000).toISOString());
});

test('counts commit dates in the local display timezone', () => {
  assert.equal(dateInKolkata('2026-11-06T20:00:00Z'), '2026-11-07');
});
