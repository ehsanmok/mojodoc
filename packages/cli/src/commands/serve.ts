/**
 * Serve command - build and serve with live reload.
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { resolve, extname } from 'path';
import chalk from 'chalk';
import open from 'open';

import { build, type BuildOptions } from './build.js';

export interface ServeOptions extends BuildOptions {
  port?: number;
}

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

export async function serve(options: ServeOptions): Promise<void> {
  const port = options.port || 3000;
  const cwd = process.cwd();
  const outDir = resolve(cwd, options.outDir || 'target/doc');

  // First, build the docs
  await build({ ...options, open: false });

  // Create simple static file server
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
          // Redirect to add trailing slash
          res.writeHead(301, { Location: urlPath + '/' });
          res.end();
          return;
        }
      } catch {
        // Try adding .html extension
        const htmlPath = filePath + '.html';
        try {
          await stat(htmlPath);
          const content = await readFile(htmlPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        } catch {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
      }

      // Read and serve file
      const content = await readFile(filePath);
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error(chalk.red('Server error:'), error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log();
    console.log(chalk.green('  Documentation server running at:'));
    console.log();
    console.log(`    ${chalk.cyan(url)}`);
    console.log();
    console.log(chalk.dim('  Press Ctrl+C to stop'));
    console.log();

    if (options.open) {
      open(url);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log();
    console.log(chalk.dim('Shutting down...'));
    server.close();
    process.exit(0);
  });
}
