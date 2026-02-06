import { spawn } from 'child_process';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

export type WhisperCppOptions = {
  /** Absolute or relative path to a local audio file */
  audioPath: string;
  /** Absolute path to ggml model file. If omitted, tries WHISPERCPP_MODEL then cache default. */
  modelPath?: string;
  /** e.g. "en". If omitted, whisper.cpp auto-detects. */
  language?: string;
  /** Threads passed to whisper.cpp */
  threads?: number;
};

export type WhisperCppResult = {
  text: string;
  rawStdout: string;
  rawStderr: string;
};

function repoRoot(): string {
  // lib/* is one level below root
  return path.resolve(__dirname, '..');
}

function defaultCacheDir(): string {
  return path.join(repoRoot(), '.cache', 'whispercpp');
}

function defaultRepoDir(): string {
  return path.join(defaultCacheDir(), 'repo');
}

export function resolveWhisperCppBin(): string {
  if (process.env.WHISPERCPP_BIN) return process.env.WHISPERCPP_BIN;

  const repoDir = defaultRepoDir();
  const candidates = [
    path.join(repoDir, 'build', 'bin', 'whisper-cli'),
    path.join(repoDir, 'build', 'bin', 'main'),
    path.join(repoDir, 'main'),
  ];

  const hit = candidates.find((p) => existsSync(p));
  if (!hit) {
    throw new Error(
      `whisper.cpp binary not found. Run: bash scripts/whispercpp/setup.sh\nTried:\n${candidates.join('\n')}`,
    );
  }

  return hit;
}

export function resolveWhisperCppModel(modelName = 'base.en'): string {
  if (process.env.WHISPERCPP_MODEL) return process.env.WHISPERCPP_MODEL;

  const repoDir = defaultRepoDir();
  const candidate = path.join(repoDir, 'models', `ggml-${modelName}.bin`);
  if (!existsSync(candidate)) {
    throw new Error(
      `whisper.cpp model not found: ${candidate}\nRun: bash scripts/whispercpp/setup.sh ${modelName}`,
    );
  }
  return candidate;
}

async function run(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, stderr, code: code ?? 0 }));
  });
}

async function ensureDir(p: string) {
  await mkdir(p, { recursive: true });
}

async function hasFfmpeg(): Promise<boolean> {
  try {
    const { code } = await run('ffmpeg', ['-version']);
    return code === 0;
  } catch {
    return false;
  }
}

async function convertToWav16kMono(inputPath: string, outPath: string): Promise<void> {
  if (!(await hasFfmpeg())) {
    throw new Error(
      'ffmpeg not found; cannot convert audio. Provide a 16kHz mono WAV file or install ffmpeg.',
    );
  }

  const { code, stderr } = await run('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-ar',
    '16000',
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    outPath,
  ]);

  if (code !== 0) {
    throw new Error(`ffmpeg conversion failed (code ${code}): ${stderr}`);
  }
}

function looksLikeWav(p: string): boolean {
  return p.toLowerCase().endsWith('.wav');
}

/**
 * Runs whisper.cpp on a local audio file and returns the plain text transcript.
 */
export async function transcribeWithWhisperCpp(opts: WhisperCppOptions): Promise<WhisperCppResult> {
  const bin = resolveWhisperCppBin();
  const model = opts.modelPath ?? resolveWhisperCppModel();

  const workDir = path.join(defaultCacheDir(), 'tmp');
  await ensureDir(workDir);

  const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
  const outPrefix = path.join(workDir, `transcript-${id}`);

  let audioPath = path.resolve(opts.audioPath);

  // whisper.cpp is happiest with 16kHz mono WAV.
  if (!looksLikeWav(audioPath)) {
    const wavPath = `${outPrefix}.wav`;
    await convertToWav16kMono(audioPath, wavPath);
    audioPath = wavPath;
  }

  const args: string[] = [
    '-m',
    model,
    '-f',
    audioPath,
    '-of',
    outPrefix,
    '-otxt',
  ];

  if (opts.language) {
    args.push('-l', opts.language);
  }
  if (typeof opts.threads === 'number') {
    args.push('-t', String(opts.threads));
  } else {
    // default to physical cores, capped
    const t = Math.max(1, Math.min(os.cpus().length, 8));
    args.push('-t', String(t));
  }

  const { stdout, stderr, code } = await run(bin, args);

  if (code !== 0) {
    throw new Error(`whisper.cpp failed (code ${code}). stderr:\n${stderr}`);
  }

  // Prefer reading the output .txt created by -otxt
  const txtPath = `${outPrefix}.txt`;
  let text = '';
  if (existsSync(txtPath)) {
    text = (await readFile(txtPath, 'utf8')).trim();
  } else {
    // Fallback: try to extract something from stdout
    text = stdout.trim();
  }

  return { text, rawStdout: stdout, rawStderr: stderr };
}

export async function transcribeBase64WithWhisperCpp(params: {
  audioBase64: string;
  /** File extension hint, e.g. "wav", "m4a", "mp3", "webm" */
  ext?: string;
  modelPath?: string;
  language?: string;
  threads?: number;
}): Promise<WhisperCppResult> {
  const cache = defaultCacheDir();
  const inDir = path.join(cache, 'in');
  await ensureDir(inDir);

  const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
  const ext = (params.ext ?? 'wav').replace(/^\./, '');
  const inPath = path.join(inDir, `audio-${id}.${ext}`);

  const buf = Buffer.from(params.audioBase64, 'base64');
  await writeFile(inPath, buf);

  return await transcribeWithWhisperCpp({
    audioPath: inPath,
    modelPath: params.modelPath,
    language: params.language,
    threads: params.threads,
  });
}
