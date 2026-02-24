/**
 * Serve command - delegates to build with --open and live reload enabled.
 */

import { build, type BuildOptions } from './build.js';

export interface ServeOptions extends BuildOptions {
  port?: number;
}

export async function serve(options: ServeOptions): Promise<void> {
  // build() with open=true starts the server with live reload.
  await build({ ...options, open: true });
}
