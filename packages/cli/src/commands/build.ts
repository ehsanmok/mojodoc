/**
 * Build command - generates documentation.
 */

import { resolve, extname } from 'path';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';

import { parseJson } from '@mojodoc/parser';
import { transform } from '@mojodoc/transform';
import { render } from '@mojodoc/renderer';

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

import { runMojoDoc, checkMojoAvailable } from '../mojo-doc.js';
import { loadConfig, findPackagePath } from '../config.js';

/**
 * Recursively scan a directory for all .mojo files and read their contents.
 * Returns a Map of relative paths to file contents.
 */
function scanMojoFiles(dir: string, baseDir: string = dir): Map<string, string> {
  const files = new Map<string, string>();

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      try {
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
          // Skip hidden directories and common non-source directories
          if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== '__pycache__') {
            const subFiles = scanMojoFiles(fullPath, baseDir);
            for (const [path, content] of subFiles) {
              files.set(path, content);
            }
          }
        } else if (entry.endsWith('.mojo')) {
          const relativePath = relative(baseDir, fullPath);
          const content = readFileSync(fullPath, 'utf-8');
          files.set(relativePath, content);
        }
      } catch {
        // Skip files we can't read
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Find the project root by looking for pixi.toml.
 * Walks up from the given path until it finds pixi.toml or reaches root.
 */
async function findProjectRoot(startPath: string): Promise<string> {
  let current = resolve(startPath);

  while (current !== dirname(current)) {
    if (existsSync(join(current, 'pixi.toml'))) {
      return current;
    }
    current = dirname(current);
  }

  // If no pixi.toml found, return the original path
  return resolve(startPath);
}

export interface BuildOptions {
  path?: string;
  open?: boolean;
  outDir?: string;
  config?: string;
  diagnose?: boolean;
  verbose?: boolean;
  port?: number;
  repository?: string;
  baseUrl?: string;
}

export async function build(options: BuildOptions): Promise<void> {
  const startTime = Date.now();
  const cwd = process.cwd();

  // Check mojo availability
  const spinner = ora('Checking mojo installation...').start();

  const mojoAvailable = await checkMojoAvailable(cwd);
  if (!mojoAvailable) {
    spinner.fail(chalk.red('Mojo is not available. Make sure mojo is installed.'));
    process.exit(1);
  }

  spinner.text = 'Loading configuration...';

  // Determine package path first - it may contain pixi.toml
  const packagePath = findPackagePath(cwd, options.path);

  // Determine the project root (where pixi.toml is likely located)
  // If packagePath is a subdirectory (like "mojson/mojson"), go up to find pixi.toml
  const projectRoot = await findProjectRoot(packagePath);

  // Load config from the project root (where pixi.toml lives)
  const config = await loadConfig(options.config, projectRoot);

  spinner.text = `Extracting documentation from ${chalk.cyan(packagePath)}...`;

  try {
    // Run mojo doc
    const { json, warnings } = await runMojoDoc({
      path: packagePath,
      diagnose: options.diagnose ?? true,
      basePath: config.site.baseUrl,
      cwd,
    });

    // Show warnings
    if (warnings.length > 0 && options.verbose) {
      spinner.info(chalk.yellow(`${warnings.length} documentation warning(s)`));
      for (const warning of warnings) {
        console.log(chalk.dim(`  ${warning}`));
      }
    }

    spinner.text = 'Parsing documentation...';

    // Parse JSON
    const parsed = parseJson(json);

    spinner.text = 'Transforming documentation...';

    // Scan all .mojo files to extract module docstrings
    spinner.text = 'Scanning source files for docstrings...';
    const moduleFiles = scanMojoFiles(packagePath);

    // Get __init__.mojo content if it exists
    const initFileContent = moduleFiles.get('__init__.mojo');

    // Transform
    const site = transform(parsed, {
      name: config.package.name,
      version: config.package.version,
      description: config.site.description,
      baseUrl: options.baseUrl || config.site.baseUrl,
      repository: options.repository || config.site.repository,
      editLink: config.site.editLink,
      initFileContent,
      moduleFiles,
    });

    spinner.text = 'Rendering HTML...';

    // Render
    const outDir = resolve(cwd, options.outDir || config.output.dir);
    await render(site, outDir);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const itemCount = site.searchIndex.items.length;

    spinner.succeed(
      chalk.green(`Documentation built in ${elapsed}s`) +
        chalk.dim(` (${itemCount} items) → ${outDir}`)
    );

    // Open in browser if requested - start a local server like cargo doc
    if (options.open) {
      const port = options.port || 3000;
      const rootPkgName = site.rootPackage.name;

      await startServer(outDir, port, rootPkgName);
    }
  } catch (error) {
    spinner.fail(chalk.red('Build failed'));

    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (options.verbose && error.stack) {
        console.error(chalk.dim(error.stack));
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

/**
 * Start a local HTTP server and open the browser.
 * Returns a Promise that blocks until the server is shut down (Ctrl+C).
 */
function startServer(outDir: string, port: number, rootPkgName: string): Promise<void> {
  return new Promise((done, reject) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = req.url || '/';

        // Remove query string
        urlPath = urlPath.split('?')[0];

        // Default to index.html for directories
        if (urlPath.endsWith('/')) {
          urlPath += 'index.html';
        }

        // Security: prevent directory traversal
        const filePath = resolve(outDir, '.' + urlPath);
        if (!filePath.startsWith(outDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        // Check if file exists
        try {
          const fileStat = await stat(filePath);
          if (fileStat.isDirectory()) {
            res.writeHead(301, { Location: urlPath + '/' });
            res.end();
            return;
          }
        } catch {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        // Read and serve file
        const content = await readFile(filePath);
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    // Handle port in use - try next port
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(chalk.yellow(`  Port ${port} in use, trying ${port + 1}...`));
        server.close();
        startServer(outDir, port + 1, rootPkgName)
          .then(done)
          .catch(reject);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      const url = `http://localhost:${port}/${rootPkgName}/`;
      console.log();
      console.log(chalk.green('  Documentation server running at:'));
      console.log();
      console.log(`    ${chalk.cyan(url)}`);
      console.log();
      console.log(chalk.dim('  Press Ctrl+C to stop'));
      console.log();

      open(url);
    });

    // Handle graceful shutdown - resolve the promise when server closes
    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.dim('Shutting down...'));
      server.close(() => {
        done();
        process.exit(0);
      });
    });
  });
}
