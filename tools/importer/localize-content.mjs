/* eslint-disable no-console */
/**
 * Post-import step for imported .plain.html files (run after run-bulk-import.js):
 * site links (https://main--tmx--chis-adobe.aem.page/...) become relative (/...).
 * Icons stay in :icon-name: notation — the form the DA editor keeps; Edge Delivery turns it
 * into icons on preview/live, and scripts.js does the same on the local dev server.
 * usage: node tools/importer/localize-content.mjs content/australia/index.plain.html ...
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const SITE = /https:\/\/main--tmx--chis-adobe\.aem\.(page|live)(?=\/)/g;
const contentRoot = resolve('content');

process.argv.slice(2).forEach((file) => {
  const path = resolve(file);
  if (relative(contentRoot, path).startsWith('..') || !path.endsWith('.plain.html')) {
    console.error(`skipped (not a content .plain.html file): ${file}`);
    return;
  }
  writeFileSync(path, readFileSync(path, 'utf8').replace(SITE, ''));
  console.log(`localized ${file}`);
});
