import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'build-metadata.json');

const readExistingMetadata = async () => {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const runGitLog = () => {
  const output = execFileSync(
    'git',
    ['log', '-1', '--format=%ct%n%s%n%h'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  ).trim();

  const [timestampLine = '', messageLine = '', shortHashLine = ''] = output.split(/\r?\n/);
  const latestCommitTimestamp = Number.parseInt(timestampLine, 10) * 1000;

  return {
    latestCommitTimestamp: Number.isFinite(latestCommitTimestamp) ? latestCommitTimestamp : 0,
    latestCommitMessage: messageLine.trim(),
    latestCommitShortHash: shortHashLine.trim(),
  };
};

const buildMetadata = async () => {
  const existing = await readExistingMetadata();

  try {
    return {
      ...runGitLog(),
      generatedAt: Date.now(),
    };
  } catch {
    return {
      latestCommitTimestamp: existing?.latestCommitTimestamp ?? 0,
      latestCommitMessage: existing?.latestCommitMessage ?? process.env.VERCEL_GIT_COMMIT_MESSAGE?.trim() ?? '',
      latestCommitShortHash: existing?.latestCommitShortHash ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '',
      generatedAt: Date.now(),
    };
  }
};

const writeMetadata = async () => {
  const metadata = await buildMetadata();
  const nextContent = `${JSON.stringify(metadata, null, 2)}\n`;

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const previousContent = await fs.readFile(OUTPUT_PATH, 'utf8').catch(() => '');
  if (previousContent === nextContent) {
    return;
  }

  await fs.writeFile(OUTPUT_PATH, nextContent, 'utf8');
};

await writeMetadata();
