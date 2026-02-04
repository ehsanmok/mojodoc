/**
 * Tests for the transform package.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseJson } from '../packages/parser/src/index.js';
import { transform, buildNavTree, buildSearchIndex } from '../packages/transform/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, './fixtures');

describe('transform', () => {
  it('transforms parsed JSON into DocSite', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    expect(site.config.name).toBe('testlib');
    expect(site.rootPackage.name).toBe('testlib');
    expect(site.allModules.length).toBeGreaterThan(0);
  });

  it('processes function overloads', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed);

    const coreModule = site.allModules.find(m => m.name === 'core');
    expect(coreModule).toBeDefined();

    const greetFn = coreModule?.functions.find(f => f.name === 'greet');
    expect(greetFn).toBeDefined();
    expect(greetFn?.overloads).toHaveLength(1);
    expect(greetFn?.overloads[0].signature).toBe('greet(name: String) -> String');
  });

  it('highlights signatures', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed);

    const coreModule = site.allModules.find(m => m.name === 'core');
    const greetFn = coreModule?.functions.find(f => f.name === 'greet');

    expect(greetFn?.overloads[0].signatureHtml).toContain('sig-');
  });
});

describe('buildNavTree', () => {
  it('builds navigation tree', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);

    if (parsed.decl.kind === 'package') {
      const navTree = buildNavTree(parsed.decl);

      expect(navTree).toHaveLength(1);
      expect(navTree[0].name).toBe('testlib');
      expect(navTree[0].type).toBe('package');
    }
  });
});

describe('buildSearchIndex', () => {
  it('builds search index', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed);

    expect(site.searchIndex.items.length).toBeGreaterThan(0);

    const greetItem = site.searchIndex.items.find(i => i.name === 'greet');
    expect(greetItem).toBeDefined();
    expect(greetItem?.kind).toBe('function');
  });
});
