/**
 * Configuration loading and defaults.
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, join, basename } from 'path';
import { execSync } from 'child_process';

export interface ModocConfig {
  package: {
    name: string;
    version: string;
    path: string;
  };
  output: {
    dir: string;
  };
  site: {
    title: string;
    description: string;
    baseUrl: string;
    repository?: string;
    editLink: boolean;
  };
  theme: {
    preset: 'default' | 'minimal';
  };
}

const DEFAULT_CONFIG: ModocConfig = {
  package: {
    name: '',
    version: '0.1.0',
    path: '.',
  },
  output: {
    dir: 'target/doc',
  },
  site: {
    title: 'API Documentation',
    description: '',
    baseUrl: '/',
    editLink: false,
  },
  theme: {
    preset: 'default',
  },
};

/**
 * Load configuration from various sources.
 */
export async function loadConfig(
  _configPath?: string,
  cwd: string = process.cwd()
): Promise<ModocConfig> {
  const config = { ...DEFAULT_CONFIG };

  // Try to load from pixi.toml for package info
  const pixiPath = resolve(cwd, 'pixi.toml');
  if (existsSync(pixiPath)) {
    try {
      const pixiContent = await readFile(pixiPath, 'utf-8');
      const nameMatch = pixiContent.match(/name\s*=\s*"([^"]+)"/);
      const versionMatch = pixiContent.match(/version\s*=\s*"([^"]+)"/);

      if (nameMatch) {
        config.package.name = nameMatch[1];
        config.site.title = `${nameMatch[1]} - API Documentation`;
      }
      if (versionMatch) {
        config.package.version = versionMatch[1];
      }
    } catch {
      // Ignore errors reading pixi.toml
    }
  }

  // If no name found, use directory name
  if (!config.package.name) {
    config.package.name = basename(cwd);
  }

  // Try to detect package path
  const possiblePaths = [
    config.package.name, // Same as package name
    'src',
    '.',
  ];

  for (const p of possiblePaths) {
    const fullPath = resolve(cwd, p);
    if (existsSync(fullPath) && existsSync(join(fullPath, '__init__.mojo'))) {
      config.package.path = p;
      break;
    }
  }

  // Try to detect repository URL from git remote
  if (!config.site.repository) {
    try {
      const gitRemote = execSync('git remote get-url origin', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      // Convert SSH URLs to HTTPS
      // git@github.com:user/repo.git -> https://github.com/user/repo
      let repoUrl = gitRemote;
      if (repoUrl.startsWith('git@')) {
        repoUrl = repoUrl
          .replace('git@', 'https://')
          .replace(':', '/')
          .replace(/\.git$/, '');
      } else if (repoUrl.endsWith('.git')) {
        repoUrl = repoUrl.replace(/\.git$/, '');
      }

      config.site.repository = repoUrl;
    } catch {
      // Not a git repo or no remote, ignore
    }
  }

  // TODO: Load from mojodoc.config.ts if configPath provided

  return config;
}

/**
 * Find the package path to document.
 */
export function findPackagePath(cwd: string, specified?: string): string {
  if (specified) {
    return resolve(cwd, specified);
  }

  // Try common locations
  const candidates = [
    // Current directory if it has __init__.mojo
    '.',
    // src directory
    'src',
  ];

  for (const candidate of candidates) {
    const fullPath = resolve(cwd, candidate);
    if (existsSync(join(fullPath, '__init__.mojo'))) {
      return fullPath;
    }
    // Also check for any .mojo files
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Default to current directory
  return cwd;
}
