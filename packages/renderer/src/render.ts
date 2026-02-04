/**
 * Main renderer - generates static HTML site from DocSite.
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { DocSite, Module, Package } from '@mojodoc/transform';
import { layoutTemplate, moduleTemplate, packageIndexTemplate } from './templates.js';
import { styles } from './styles.js';
import { scripts } from './scripts.js';

export interface RenderOptions {
  outDir: string;
}

/**
 * Render a DocSite to static HTML files.
 */
export async function render(site: DocSite, outDir: string): Promise<void> {
  // Clean output directory if it exists (always regenerate fresh)
  if (existsSync(outDir)) {
    await rm(outDir, { recursive: true, force: true });
  }

  // Create output directory
  await mkdir(outDir, { recursive: true });

  // Write assets
  await writeAssets(outDir);

  // Render package index
  await renderPackage(site, site.rootPackage, outDir, '');

  // Write search index
  await writeFile(join(outDir, 'search-index.json'), JSON.stringify(site.searchIndex, null, 2));
}

/**
 * Write CSS and JS assets.
 */
async function writeAssets(outDir: string): Promise<void> {
  const assetsDir = join(outDir, 'assets');
  await mkdir(assetsDir, { recursive: true });

  await writeFile(join(assetsDir, 'styles.css'), styles);
  await writeFile(join(assetsDir, 'main.js'), scripts);
}

/**
 * Render a package and its contents.
 */
async function renderPackage(
  site: DocSite,
  pkg: Package,
  outDir: string,
  parentPath: string
): Promise<void> {
  const pkgDir = parentPath ? join(outDir, parentPath, pkg.name) : join(outDir, pkg.name);
  await mkdir(pkgDir, { recursive: true });

  const currentPath = parentPath ? `${parentPath}/${pkg.name}` : pkg.name;

  // Render package index
  const indexContent = packageIndexTemplate(pkg);
  const indexHtml = layoutTemplate(indexContent, site, currentPath);
  await writeFile(join(pkgDir, 'index.html'), indexHtml);

  // Render modules
  for (const mod of pkg.modules) {
    if (mod.name === '__init__') {
      // __init__ content goes on package index, but we still create module page
      // for direct linking
      continue;
    }

    await renderModule(site, mod, pkgDir, currentPath);
  }

  // Render subpackages
  for (const subPkg of pkg.subpackages) {
    await renderPackage(site, subPkg, outDir, currentPath);
  }
}

/**
 * Render a module page.
 */
async function renderModule(
  site: DocSite,
  mod: Module,
  parentDir: string,
  parentPath: string
): Promise<void> {
  const modDir = join(parentDir, mod.name);
  await mkdir(modDir, { recursive: true });

  const currentPath = `${parentPath}/${mod.name}`;

  // Build source link if repository is configured
  const sourceLink = site.config.repository
    ? buildSourceLink(site.config.repository, site.rootPackage.name, mod.sourceFile)
    : null;

  const content = moduleTemplate(mod, sourceLink);
  const html = layoutTemplate(content, site, currentPath);

  await writeFile(join(modDir, 'index.html'), html);
}

/**
 * Get the relative path to root from a given path.
 */
export function getRelativeRoot(path: string): string {
  const depth = path.split('/').filter(Boolean).length;
  if (depth === 0) return '.';
  return Array(depth).fill('..').join('/');
}

/**
 * Build a source link URL for GitHub/GitLab repositories.
 *
 * @param repository - Repository URL (e.g., "https://github.com/user/repo")
 * @param packageName - Package name (e.g., "mojson")
 * @param sourceFile - Source file path relative to package (e.g., "config.mojo")
 * @returns Full URL to source file on the repository hosting platform
 */
export function buildSourceLink(
  repository: string,
  packageName: string,
  sourceFile: string
): string {
  // Normalize repository URL (remove trailing slash)
  const repoUrl = repository.replace(/\/$/, '');

  // Determine the hosting platform and build the appropriate URL
  if (repoUrl.includes('github.com')) {
    // GitHub: https://github.com/user/repo/blob/main/pkg/file.mojo
    return `${repoUrl}/blob/main/${packageName}/${sourceFile}`;
  } else if (repoUrl.includes('gitlab.com')) {
    // GitLab: https://gitlab.com/user/repo/-/blob/main/pkg/file.mojo
    return `${repoUrl}/-/blob/main/${packageName}/${sourceFile}`;
  } else {
    // Generic: assume similar to GitHub structure
    return `${repoUrl}/blob/main/${packageName}/${sourceFile}`;
  }
}
