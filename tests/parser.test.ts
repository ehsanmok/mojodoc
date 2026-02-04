/**
 * Tests for the parser package.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseJson, flattenModules, countItems } from '../packages/parser/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXTURES_DIR = resolve(__dirname, './fixtures');

describe('parseJson', () => {
  it('parses valid JSON', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const result = parseJson(json);

    expect(result.version).toBe('0.26.2.0.dev2026020305');
    expect(result.decl.kind).toBe('package');
    expect(result.decl.name).toBe('testlib');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJson('not json')).toThrow();
  });

  it('extracts modules', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const result = parseJson(json);

    if (result.decl.kind === 'package') {
      expect(result.decl.modules).toHaveLength(2);
      expect(result.decl.modules[0].name).toBe('__init__');
      expect(result.decl.modules[1].name).toBe('core');
    }
  });

  it('extracts functions', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const result = parseJson(json);

    if (result.decl.kind === 'package') {
      const coreModule = result.decl.modules.find(m => m.name === 'core');
      expect(coreModule?.functions).toHaveLength(2);
      expect(coreModule?.functions[0].name).toBe('greet');
    }
  });
});

describe('flattenModules', () => {
  it('flattens module tree', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const result = parseJson(json);

    if (result.decl.kind === 'package') {
      const modules = flattenModules(result.decl);
      expect(modules).toHaveLength(2);
    }
  });
});

describe('countItems', () => {
  it('counts documented items', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const result = parseJson(json);

    if (result.decl.kind === 'package') {
      const count = countItems(result.decl);
      expect(count).toBe(2); // 2 functions
    }
  });
});
