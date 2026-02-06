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

describe('type cross-referencing', () => {
  it('links stdlib types in signatures', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const coreModule = site.allModules.find(m => m.name === 'core');
    const greetFn = coreModule?.functions.find(f => f.name === 'greet');
    const sigHtml = greetFn?.overloads[0].signatureHtml || '';

    // String type in signature should be linked to Mojo stdlib docs
    expect(sigHtml).toContain('type-link');
    expect(sigHtml).toContain('docs.modular.com/mojo/stdlib');
  });

  it('links stdlib types in arg types', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const coreModule = site.allModules.find(m => m.name === 'core');
    const greetFn = coreModule?.functions.find(f => f.name === 'greet');
    const argHtml = greetFn?.overloads[0].args[0].typeHtml || '';

    // Arg type 'String' should link to stdlib
    expect(argHtml).toContain('type-link');
    expect(argHtml).toContain('docs.modular.com/mojo/stdlib');
  });

  it('links local types in signatures', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const typesModule = site.allModules.find(m => m.name === 'types');
    const processFn = typesModule?.functions.find(f => f.name === 'process_items');
    const sigHtml = processFn?.overloads[0].signatureHtml || '';

    // Both 'Item' and 'Result' should be linked as local types
    expect(sigHtml).toContain('testlib/types/index.html#Item');
    expect(sigHtml).toContain('testlib/types/index.html#Result');
  });

  it('links local types in return types', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const typesModule = site.allModules.find(m => m.name === 'types');
    const processFn = typesModule?.functions.find(f => f.name === 'process_items');
    const returnHtml = processFn?.overloads[0].returns?.typeHtml || '';

    // Return type 'Result' should link to local type
    expect(returnHtml).toContain('type-link');
    expect(returnHtml).toContain('testlib/types/index.html');
  });

  it('links cross-module local types in field types', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const typesModule = site.allModules.find(m => m.name === 'types');
    const itemStruct = typesModule?.structs.find(s => s.name === 'Item');
    const configField = itemStruct?.fields.find(f => f.name === 'config');
    const fieldHtml = configField?.typeHtml || '';

    // Field type 'Config' should link to core module's Config struct
    expect(fieldHtml).toContain('type-link');
    expect(fieldHtml).toContain('testlib/core/index.html#Config');
  });

  it('builds type registry with all local types', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    // The types module should have structs with proper signature links
    const typesModule = site.allModules.find(m => m.name === 'types');
    expect(typesModule).toBeDefined();
    expect(typesModule?.structs).toHaveLength(2);

    // Config from core module should be discoverable as a type link
    // when referenced in the types module
    const itemStruct = typesModule?.structs.find(s => s.name === 'Item');
    expect(itemStruct).toBeDefined();
  });

  it('links individual type components in complex types', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);
    const site = transform(parsed, { name: 'testlib' });

    const typesModule = site.allModules.find(m => m.name === 'types');
    const processFn = typesModule?.functions.find(f => f.name === 'process_items');
    const sigHtml = processFn?.overloads[0].signatureHtml || '';

    // 'List' should be linked (stdlib) and 'Item' should be linked (local)
    // They should be separate links, not one big link
    expect(sigHtml).toContain('docs.modular.com');  // List -> stdlib
    expect(sigHtml).toContain('testlib/types/index.html#Item');  // Item -> local
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
