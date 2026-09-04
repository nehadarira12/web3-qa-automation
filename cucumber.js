// Cucumber.js's own config-file loader has to be able to load this file
// before any TypeScript loader is registered, so it has to stay plain JS —
// a `cucumber.config.ts` would need a TS loader active just to be read.
// This file is the single source of truth for run configuration.
//
// The project is ESM throughout (`"type": "module"` in package.json).
// TypeScript execution comes from tsx, registered via
// `NODE_OPTIONS='--import tsx/esm'` in every npm script that runs
// cucumber-js (see package.json) rather than this config's own `loader`
// key: Cucumber's `loader` option maps to Node's old `--experimental-loader`
// hook, which tsx's current version explicitly refuses to be registered
// through (it requires `--import`). `NODE_OPTIONS` gets tsx active before
// Node even starts loading this file, so the `import` globs below can load
// our TypeScript support files and step definitions directly — no build step.
//
// This exports a single flat profile rather than a `{ default, critical,
// ... }` map of named profiles: Cucumber's loader for ESM config files
// (`.js`/`.mjs`/`.ts` under a `"type": "module"` package) reads the file via
// dynamic `import()`, whose result is `{ default: <this object> }` — one
// level more nesting than the plain `module.exports = {...}` a CommonJS
// config produces. Cucumber's `fromFile` only unwraps that extra level for
// the implicit single "default" profile; a named-profile map loses
// everything past `default` under this loader path. Tag-based subsets
// (`@critical`, `@high`) are driven by `--tags` on the CLI instead (see the
// `test:*` scripts in package.json), which sidesteps the issue entirely.
export default {
  paths: ['features/**/*.feature'],
  import: ['support/**/*.ts', 'step-definitions/**/*.ts'],
  format: ['progress-bar', 'summary', 'allure-cucumberjs/reporter'],
  formatOptions: {
    resultsDir: 'allure-results',
    snippetInterface: 'async-await',
  },
  publishQuiet: true,
  worldParameters: {
    network: process.env.NETWORK ?? 'sepolia',
  },
};
