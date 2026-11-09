#!/usr/bin/env node
/**
 * Post-import step: the importer makes every link and image URL absolute. Links to migrated
 * pages and locally hosted media are emitted on this project's preview host (see
 * tmx-helpers.js SITE); this rewrites them to site-relative paths in the given content files.
 *
 * Usage: node tools/importer/relativize-links.mjs content/index.plain.html [more files...]
 */
import { readFileSync, writeFileSync } from 'fs';

const SITE = 'https://main--tmx--chis-adobe.aem.page/';

process.argv.slice(2).forEach((file) => {
  const before = readFileSync(file, 'utf-8');
  const after = before.split(SITE).join('/');
  if (after !== before) {
    writeFileSync(file, after, 'utf-8');
    console.log(`relativized ${before.split(SITE).length - 1} URL(s) in ${file}`);
  }
});
