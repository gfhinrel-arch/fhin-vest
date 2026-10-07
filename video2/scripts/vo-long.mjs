// Generate one MP3 per narration line with edge-tts, and write vo.json with
// measured durations (from edge-tts SRT timestamps, no ffprobe needed).
//   node scripts/vo.mjs            # fill missing
//   node scripts/vo.mjs --force    # regenerate all

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public', 'vo');
const tmp = resolve(root, '.vo-tmp');
mkdirSync(outDir, {recursive: true});

const VOICE = 'en-US-AndrewNeural';
const RATE = '+6%';

const src = readFileSync(resolve(root, 'src', 'vo-script-long.ts'), 'utf8');
const lines = [...src.matchAll(/id:\s*'([^']+)',\s*at:\s*([\d.]+),\s*text:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => ({
  id: m[1],
  at: Number(m[2]),
  text: m[3].replace(/\\'/g, "'"),
}));
if (!lines.length) {
  console.error('No lines parsed from src/vo-script-long.ts');
  process.exit(1);
}

const force = process.argv.includes('--force');
const metaPath = resolve(outDir, 'vo-long.json');
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};

const srtEnd = (srt) => {
  const e = [...srt.matchAll(/-->\s*(\d\d):(\d\d):(\d\d),(\d\d\d)/g)].pop();
  if (!e) return 0;
  return Number(e[1]) * 3600 + Number(e[2]) * 60 + Number(e[3]) + Number(e[4]) / 1000;
};

for (const line of lines) {
  const mp3 = resolve(outDir, `${line.id}.mp3`);
  if (!force && existsSync(mp3) && meta[line.id]) {
    console.log(`skip  ${line.id}`);
    continue;
  }
  rmSync(tmp, {recursive: true, force: true});
  mkdirSync(tmp, {recursive: true});
  const txt = resolve(tmp, `${line.id}.txt`);
  const srt = resolve(tmp, `${line.id}.srt`);
  writeFileSync(txt, line.text, 'utf8');
  execFileSync('python', ['-m', 'edge_tts', '--voice', VOICE, '--rate', RATE, '--file', txt, '--write-media', mp3, '--write-subtitles', srt], {stdio: 'inherit'});
  meta[line.id] = {dur: Number(srtEnd(readFileSync(srt, 'utf8')).toFixed(2))};
  console.log(`make  ${line.id}  ${meta[line.id].dur}s`);
}

// Lay the lines out back to back with a fixed gap, so nothing overlaps regardless
// of what the `at` field in the script says. `at` is derived, not authored.
const GAP = 0.35;
let cursor = 0;
for (const line of lines) {
  const dur = meta[line.id]?.dur ?? 0;
  if (line.id === lines[0].id) cursor = 1.0; // small lead-in
  cursor = Number(cursor.toFixed(2));
  meta[line.id] = {at: cursor, dur};
  cursor += dur + GAP;
}

writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
rmSync(tmp, {recursive: true, force: true});
console.log(`\nWrote ${Object.keys(meta).length} lines to public/vo/vo-long.json (last end ${cursor.toFixed(1)}s)`);
