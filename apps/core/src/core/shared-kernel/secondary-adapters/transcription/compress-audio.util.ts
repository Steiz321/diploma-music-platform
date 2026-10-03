import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// Speech-recognition friendly mp3: 16 kHz, mono, 64 kbps (~0.5 MB per minute)
const FFMPEG_ARGS = [
  '-vn',
  '-ac',
  '1',
  '-ar',
  '16000',
  '-b:a',
  '64k',
  '-f',
  'mp3',
];

const runFfmpeg = (args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';

    ffmpeg.stderr.on('data', (chunk) => (stderr += chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`),
          ),
    );
  });

export const compressAudioForTranscription = async (
  audio: Buffer,
): Promise<Buffer> => {
  const dir = await mkdtemp(join(tmpdir(), 'transcription-'));
  const input = join(dir, 'input');
  const output = join(dir, 'output.mp3');

  try {
    await writeFile(input, audio);
    await runFfmpeg([
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      input,
      ...FFMPEG_ARGS,
      output,
    ]);
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};
