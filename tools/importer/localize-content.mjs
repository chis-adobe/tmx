/* eslint-disable no-console */
/**
 * Post-import step for imported .plain.html files (run after run-bulk-import.js):
 * - site links (https://main--tmx--chis-adobe.aem.page/...) become relative (/...)
 * - :icon-name: notation in text becomes <span class="icon icon-icon-name"></span>, which is
 *   what Document Authoring stores for icons, so the local preview matches DA.
 * usage: node tools/importer/localize-content.mjs content/australia/index.plain.html ...
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const SITE = /https:\/\/main--tmx--chis-adobe\.aem\.(page|live)(?=\/)/g;
const ICON = /:([a-z0-9]+(?:-[a-z0-9]+)*):/g;
const contentRoot = resolve('content');

process.argv.slice(2).forEach((file) => {
  const path = resolve(file);
  if (relative(contentRoot, path).startsWith('..') || !path.endsWith('.plain.html')) {
    console.error(`skipped (not a content .plain.html file): ${file}`);
    return;
  }
  const html = readFileSync(path, 'utf8')
    .replace(SITE, '')
    // icon notation only in text between tags, never inside attributes
    .replace(/>([^<]*)</g, (m, txt) => `>${txt.replace(ICON, '<span class="icon icon-$1"></span>')}<`);
  writeFileSync(path, html);
  console.log(`localized ${file}`);
});
