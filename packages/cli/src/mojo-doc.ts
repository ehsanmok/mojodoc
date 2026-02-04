/**
 * Wrapper for running `mojo doc` subprocess.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

export interface MojoDocOptions {
  path: string;
  diagnose?: boolean;
  basePath?: string;
  importPaths?: string[];
  cwd?: string;
}

export interface MojoDocResult {
  json: string;
  warnings: string[];
}

/**
 * Run `mojo doc` and return the JSON output.
 */
export async function runMojoDoc(options: MojoDocOptions): Promise<MojoDocResult> {
  const args: string[] = ['doc'];

  if (options.diagnose) {
    args.push('--diagnose-missing-doc-strings');
  }

  if (options.basePath) {
    args.push('--docs-base-path', options.basePath);
  }

  for (const importPath of options.importPaths ?? []) {
    args.push('-I', importPath);
  }

  args.push(options.path);

  const cwd = options.cwd || process.cwd();

  // Determine if we should use pixi or direct mojo
  const usePixi = existsSync(resolve(cwd, 'pixi.toml')) || existsSync(resolve(cwd, 'pixi.lock'));

  return new Promise((resolve, reject) => {
    let cmd: string;
    let cmdArgs: string[];

    if (usePixi) {
      cmd = 'pixi';
      cmdArgs = ['run', 'mojo', ...args];
    } else {
      cmd = 'mojo';
      cmdArgs = args;
    }

    const proc = spawn(cmd, cmdArgs, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            usePixi
              ? 'Could not find pixi. Make sure pixi is installed and in your PATH.'
              : 'Could not find mojo. Make sure mojo is installed and in your PATH.'
          )
        );
      } else {
        reject(err);
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Check if it's a warning or error
        if (stdout.trim().startsWith('{')) {
          // We got JSON output, stderr contains warnings
          resolve({
            json: stdout,
            warnings: stderr.split('\\n').filter((line) => line.includes('warning:')),
          });
        } else {
          reject(new Error(`mojo doc failed with exit code ${code}:\\n${stderr}`));
        }
      } else {
        resolve({
          json: stdout,
          warnings: stderr.split('\\n').filter((line) => line.includes('warning:')),
        });
      }
    });
  });
}

/**
 * Check if mojo is available.
 */
export async function checkMojoAvailable(cwd: string = process.cwd()): Promise<boolean> {
  const usePixi = existsSync(resolve(cwd, 'pixi.toml'));

  return new Promise((resolve) => {
    const cmd = usePixi ? 'pixi' : 'mojo';
    const args = usePixi ? ['run', 'mojo', '--version'] : ['--version'];

    const proc = spawn(cmd, args, { cwd, stdio: 'pipe' });

    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}
