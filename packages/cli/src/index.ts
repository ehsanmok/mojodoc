#!/usr/bin/env node

/**
 * mojodoc - World-class API documentation generator for Mojo
 */

import { Command } from 'commander';
import { build } from './commands/build.js';
import { serve } from './commands/serve.js';

const program = new Command();

program
  .name('mojodoc')
  .description('World-class API documentation generator for Mojo 🔥')
  .version('0.1.0');

program
  .command('build', { isDefault: true })
  .description('Build documentation')
  .argument('[path]', 'Path to package or module to document')
  .option('-o, --open', 'Open in browser after build (starts local server)')
  .option('-p, --port <port>', 'Port for local server (with --open)', '3000')
  .option('--out-dir <path>', 'Output directory', 'target/doc')
  .option(
    '-r, --repository <url>',
    'Repository URL for source links (e.g., https://github.com/user/repo)'
  )
  .option('-c, --config <path>', 'Config file path')
  .option('--diagnose', 'Show missing docstring warnings', true)
  .option('-v, --verbose', 'Verbose output')
  .action(async (path, options) => {
    await build({ ...options, path, port: parseInt(options.port, 10) });
  });

program
  .command('serve')
  .description('Build and serve with live reload')
  .argument('[path]', 'Path to package or module to document')
  .option('-p, --port <port>', 'Port to serve on', '3000')
  .option('-o, --open', 'Open in browser')
  .option('--out-dir <path>', 'Output directory', 'target/doc')
  .option('-c, --config <path>', 'Config file path')
  .option('-v, --verbose', 'Verbose output')
  .action(async (path, options) => {
    await serve({ ...options, path, port: parseInt(options.port, 10) });
  });

program.parse();
