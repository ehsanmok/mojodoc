/**
 * Build command - generates documentation.
 */

import { resolve, extname, dirname, join, relative } from 'path';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFile, stat, watch } from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';

import { parseJson } from '@mojodoc/parser';
import { transform } from '@mojodoc/transform';
import { render } from '@mojodoc/renderer';

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';

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

/** Small script injected into HTML pages when watch mode is active. */
const LIVERELOAD_SCRIPT = `
<script>
(function() {
  var src = '/_livereload';
  function connect() {
    var es = new EventSource(src);
    es.addEventListener('reload', function() { location.reload(); });
    es.onerror = function() {
      es.close();
      setTimeout(connect, 2000);
    };
  }
  connect();
})();
</script>
`;

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

  const spinner = ora('Checking mojo installation...').start();

  const mojoAvailable = await checkMojoAvailable(cwd);
  if (!mojoAvailable) {
    spinner.fail(chalk.red('Mojo is not available. Make sure mojo is installed.'));
    process.exit(1);
  }

  spinner.text = 'Loading configuration...';

  const packagePath = findPackagePath(cwd, options.path);
  const projectRoot = await findProjectRoot(packagePath);
  const config = await loadConfig(options.config, projectRoot);

  spinner.text = `Extracting documentation from ${chalk.cyan(packagePath)}...`;

  try {
    const outDir = resolve(cwd, options.outDir || config.output.dir);

    await runBuildPipeline({
      packagePath,
      outDir,
      options,
      config,
      spinner,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    spinner.succeed(chalk.green(`Documentation built in ${elapsed}s`) + chalk.dim(` → ${outDir}`));

    if (options.open) {
      const port = options.port || 3000;
      const pkgName = resolvePkgName(packagePath, config);

      await startServer({
        outDir,
        port,
        rootPkgName: pkgName,
        watch: true,
        watchPath: packagePath,
        rebuildOptions: { packagePath, outDir, options, config },
      });
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

// ─── Build pipeline (reusable for watch rebuilds) ───────────────────────────

interface PipelineParams {
  packagePath: string;
  outDir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: BuildOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Awaited<ReturnType<typeof loadConfig>>;
  spinner?: ReturnType<typeof ora>;
}

async function runBuildPipeline({
  packagePath,
  outDir,
  options,
  config,
  spinner,
}: PipelineParams): Promise<string> {
  if (spinner) spinner.text = `Extracting documentation from ${chalk.cyan(packagePath)}...`;

  const { json, warnings } = await runMojoDoc({
    path: packagePath,
    diagnose: options.diagnose ?? true,
    basePath: config.site.baseUrl,
    cwd: process.cwd(),
  });

  if (warnings.length > 0 && options.verbose) {
    spinner?.info(chalk.yellow(`${warnings.length} documentation warning(s)`));
    for (const warning of warnings) {
      console.log(chalk.dim(`  ${warning}`));
    }
  }

  if (spinner) spinner.text = 'Parsing documentation...';
  const parsed = parseJson(json);

  if (spinner) spinner.text = 'Scanning source files for docstrings...';
  const moduleFiles = scanMojoFiles(packagePath);
  const initFileContent = moduleFiles.get('__init__.mojo');

  if (spinner) spinner.text = 'Transforming documentation...';
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

  if (spinner) spinner.text = 'Rendering HTML...';
  await render(site, outDir);

  return site.rootPackage.name;
}

function resolvePkgName(
  packagePath: string,
  config: Awaited<ReturnType<typeof loadConfig>>
): string {
  return config.package.name || packagePath.split('/').pop() || 'docs';
}

// ─── Server ──────────────────────────────────────────────────────────────────

interface ServerOptions {
  outDir: string;
  port: number;
  rootPkgName: string;
  /** Enable file watching and live reload. */
  watch?: boolean;
  /** Directory to watch for changes (the source .mojo package). */
  watchPath?: string;
  /** Params needed to trigger a rebuild. */
  rebuildOptions?: Omit<PipelineParams, 'spinner'>;
}

/**
 * Start a local HTTP server, optionally with file watching + live reload.
 * Returns a Promise that blocks until the server is shut down (Ctrl+C).
 */
function startServer(opts: ServerOptions): Promise<void> {
  const { outDir, port, rootPkgName, watch: watchMode = false } = opts;

  // Set of SSE response objects waiting for reload events.
  const sseClients = new Set<ServerResponse>();

  /** Broadcast a reload event to all connected SSE clients. */
  function notifyReload(): void {
    for (const client of sseClients) {
      client.write('event: reload\ndata: {}\n\n');
    }
  }

  // ── File watcher ──────────────────────────────────────────────────────────
  if (watchMode && opts.watchPath && opts.rebuildOptions) {
    const { watchPath, rebuildOptions } = opts;
    let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
    let rebuilding = false;

    const triggerRebuild = () => {
      if (rebuilding) return;
      if (rebuildTimer) clearTimeout(rebuildTimer);

      // Debounce: wait 300 ms after the last change before rebuilding.
      rebuildTimer = setTimeout(async () => {
        rebuildTimer = null;
        rebuilding = true;

        const spinner = ora(chalk.dim('Detected change — rebuilding...')).start();
        try {
          await runBuildPipeline({ ...rebuildOptions, spinner });
          spinner.succeed(chalk.green('Rebuilt') + chalk.dim(' — reloading browser'));
          notifyReload();
        } catch (err) {
          spinner.fail(chalk.red('Rebuild failed'));
          if (err instanceof Error) console.error(chalk.red(err.message));
        } finally {
          rebuilding = false;
        }
      }, 300);
    };

    // Node 18+ supports recursive watching natively (including macOS via FSEvents).
    // `fs/promises` watch returns an AsyncIterable directly.
    (async () => {
      try {
        const watcher = watch(watchPath, { recursive: true });
        for await (const event of watcher) {
          if (typeof event.filename === 'string' && event.filename.endsWith('.mojo')) {
            triggerRebuild();
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(chalk.yellow('File watcher failed:'), msg);
      }
    })();

    console.log(chalk.dim(`  Watching ${watchPath} for changes...`));
  }

  // ── HTTP server ───────────────────────────────────────────────────────────
  return new Promise((done, reject) => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const urlPath = (req.url || '/').split('?')[0];

        // SSE live reload endpoint.
        if (watchMode && urlPath === '/_livereload') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(':\n\n'); // Keep-alive comment
          sseClients.add(res);
          req.on('close', () => sseClients.delete(res));
          return;
        }

        await serveStaticFile(outDir, urlPath, res, watchMode);
      } catch {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(chalk.yellow(`  Port ${port} in use, trying ${port + 1}...`));
        server.close();
        startServer({ ...opts, port: port + 1 })
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
      if (watchMode) {
        console.log();
        console.log(chalk.dim('  Live reload enabled — browser refreshes on file changes'));
      }
      console.log();
      console.log(chalk.dim('  Press Ctrl+C to stop'));
      console.log();

      open(url);
    });

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

/**
 * Serve a single static file, injecting the live reload script into HTML pages
 * when watch mode is active.
 */
async function serveStaticFile(
  outDir: string,
  urlPath: string,
  res: ServerResponse,
  injectLivereload: boolean
): Promise<void> {
  // Normalise directory paths to index.html.
  const normalised = urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath;

  // Prevent directory traversal.
  const filePath = resolve(outDir, '.' + normalised);
  if (!filePath.startsWith(outDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Stat the resolved path; fall back to <path>.html when not found.
  let resolvedPath = filePath;
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) {
      res.writeHead(301, { Location: normalised.replace(/\/?$/, '/') });
      res.end();
      return;
    }
  } catch {
    const htmlPath = filePath + '.html';
    try {
      await stat(htmlPath);
      resolvedPath = htmlPath;
    } catch {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
  }

  const ext = extname(resolvedPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  let content: Buffer | string = await readFile(resolvedPath);

  // Inject livereload script before </body> for HTML responses.
  if (injectLivereload && (ext === '.html' || resolvedPath.endsWith('.html'))) {
    const html = content.toString('utf-8');
    content = html.includes('</body>')
      ? html.replace('</body>', LIVERELOAD_SCRIPT + '</body>')
      : html + LIVERELOAD_SCRIPT;
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}
