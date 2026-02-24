/**
 * Tests for the transform package.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseJson } from '../packages/parser/src/index.js';
import {
  transform,
  buildNavTree,
  buildSearchIndex,
  parseInitFile,
  buildPublicApi,
} from '../packages/transform/src/index.js';
import type { Module } from '../packages/transform/src/index.js';

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

describe('parseInitFile – subpackage dotted paths', () => {
  it('parses flat module imports (from .parser import loads)', () => {
    const content = `from .parser import loads, dumps\n`;
    const imports = parseInitFile(content);

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe('parser');
    expect(imports[0].items).toEqual(['loads', 'dumps']);
  });

  it('parses dotted subpackage imports (from .net.address import IpAddr)', () => {
    const content = `from .net.address import IpAddr, SocketAddr\n`;
    const imports = parseInitFile(content);

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe('net.address');
    expect(imports[0].items).toEqual(['IpAddr', 'SocketAddr']);
  });

  it('parses multiline dotted imports', () => {
    const content = [
      'from .net.error import (',
      '    NetworkError,',
      '    Timeout,',
      ')',
    ].join('\n');
    const imports = parseInitFile(content);

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe('net.error');
    expect(imports[0].items).toContain('NetworkError');
    expect(imports[0].items).toContain('Timeout');
  });

  it('attaches section comment to subsequent imports', () => {
    const content = [
      '# Networking',
      'from .net.address import IpAddr',
      'from .tcp.stream import TcpStream',
    ].join('\n');
    const imports = parseInitFile(content);

    expect(imports).toHaveLength(2);
    expect(imports[0].comment).toBe('Networking');
    expect(imports[1].comment).toBe('Networking');
  });
});

describe('buildPublicApi – subpackage modules', () => {
  /** Minimal Module stub for testing. */
  function makeModule(fullPath: string, kind: 'function' | 'struct', itemName: string): Module {
    const parts = fullPath.split('.');
    const name = parts[parts.length - 1];
    const parentPackage = parts.slice(0, -1).join('.');
    const urlPath = fullPath.replace(/\./g, '/');
    const anchor = itemName.toLowerCase();
    const baseItem = { name: itemName, anchor, summary: `Summary of ${itemName}` };
    return {
      name,
      path: fullPath,
      fullPath,
      urlPath,
      summary: '',
      description: '',
      descriptionHtml: '',
      parentPackage,
      sourceFile: `${parts.slice(1).join('/')}.mojo`,
      functions: kind === 'function' ? [{ kind: 'function', name: itemName, anchor, overloads: [{ signature: `${itemName}()`, signatureHtml: '', summary: `Summary of ${itemName}`, description: '', descriptionHtml: '', args: [], typeParams: [], returns: null, raises: null, isStatic: false, isAsync: false, deprecated: null }] }] : [],
      structs: kind === 'struct' ? [{ ...baseItem, kind: 'struct', signature: `struct ${itemName}`, signatureHtml: '', description: '', descriptionHtml: '', typeParams: [], fields: [], methods: [], deprecated: null }] : [],
      traits: [],
      aliases: [],
    };
  }

  it('resolves symbols from subpackage modules (depth-3 paths)', () => {
    const modules = [
      makeModule('flare.net.address', 'struct', 'IpAddr'),
      makeModule('flare.tcp.stream', 'struct', 'TcpStream'),
    ];

    const imports = parseInitFile([
      '# Networking',
      'from .net.address import IpAddr',
      '# TCP',
      'from .tcp.stream import TcpStream',
    ].join('\n'));

    const sections = buildPublicApi(imports, modules, 'flare');

    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Networking');
    expect(sections[0].items[0].name).toBe('IpAddr');
    expect(sections[0].items[0].kind).toBe('struct');
    expect(sections[1].title).toBe('TCP');
    expect(sections[1].items[0].name).toBe('TcpStream');
  });

  it('resolves symbols from flat modules (depth-2 paths)', () => {
    const modules = [makeModule('mojson.parser', 'function', 'loads')];

    const imports = parseInitFile('from .parser import loads\n');
    const sections = buildPublicApi(imports, modules, 'mojson');

    expect(sections).toHaveLength(1);
    expect(sections[0].items[0].name).toBe('loads');
    expect(sections[0].items[0].kind).toBe('function');
  });
});

describe('transform – subpackage public API via initFileContent', () => {
  it('produces publicApi entries for symbols in subpackage modules', () => {
    const json = readFileSync(resolve(FIXTURES_DIR, 'sample.json'), 'utf-8');
    const parsed = parseJson(json);

    // Simulate a package that re-exports from its subpackages via dotted paths.
    // sample.json has "core" as a direct module (testlib.core) with a "greet" function.
    // We test both the flat path ("from .core import greet") and a simulated
    // dotted path ("from .core import add") to exercise the relative-key logic.
    const initFileContent = [
      '# Core utilities',
      'from .core import greet',
      '# Math',
      'from .core import add',
    ].join('\n');

    const site = transform(parsed, { name: 'testlib', initFileContent });

    expect(site.rootPackage.publicApi).toHaveLength(2);

    const coreSection = site.rootPackage.publicApi[0];
    expect(coreSection.title).toBe('Core utilities');
    expect(coreSection.items[0].name).toBe('greet');
    expect(coreSection.items[0].kind).toBe('function');

    const mathSection = site.rootPackage.publicApi[1];
    expect(mathSection.title).toBe('Math');
    expect(mathSection.items[0].name).toBe('add');
  });
});
