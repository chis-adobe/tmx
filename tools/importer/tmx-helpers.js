/* global WebImporter */
/**
 * Shared helpers for the TMX import scripts (import-home.js, import-pov.js, import-press-release.js).
 *
 * The importer turns relative links and image paths into absolute source-site URLs. Links to
 * migrated pages and to locally hosted media are therefore emitted on SITE (this project's
 * EDS preview host) and made site-relative afterwards by relativize-links.mjs.
 */

export const SITE = 'https://main--tmx--chis-adobe.aem.page';
export const SOURCE = 'https://www.tmx.com';
const MEDIA = `${SITE}/media-da/media`;

/** Source pages that have been migrated, mapped to their new paths. */
const MIGRATED = {
  '/en': '/',
  '/': '/',
  '/en/pov': '/povs/',
  '/pov': '/povs/',
  '/en/pov?id=171': '/povs/2026-tsx30-mining-sector',
  '/en/pov?id=170': '/povs/2026-where-canada-is-winning',
  '/en/pov?id=169': '/povs/2026-scaling-the-tsx30',
  '/en/pov?id=168': '/povs/2026-apotex-life-sciences-ipo',
  '/en/newsroom/press-releases?id=1390': '/newsroom/press-releases/tmx-group-equity-financing-statistics-october-2026',
  '/en/newsroom/press-releases?id=1389': '/newsroom/press-releases/tmx-group-consolidated-trading-statistics-october-2026',
  '/en/newsroom/press-releases?id=1388': '/newsroom/press-releases/tmx-group-limited-declares-dividend-of-0-26-per-common-share',
};

/** New path of a migrated source page (path + query, e.g. '/en/pov?id=171'), if any. */
export const migratedPath = (key) => MIGRATED[key];

/** Path of the shared author fragment, keyed by the author's name as shown on tmx.com. */
export const AUTHORS = {
  'Dean McPherson': '/authors/dean-mcpherson',
  'Catherine Kee': '/authors/catherine-kee',
  'Richard Goodman': '/authors/richard-goodman',
  'Robert Peterman': '/authors/robert-peterman',
};

/** Shared fragments referenced by article pages (boilerplate kept in one place). */
export const DISCLAIMERS = {
  pov: '/disclaimers/pov',
  pressRelease: '/disclaimers/press-release',
};

/**
 * Teaser data that tmx.com only shows on the POV listing, keyed by article id.
 * (The article page itself carries no tags or teaser image.) Tags are taxonomy keys from the
 * block library's options sheet, without "#" (the site adds it where TMX shows hashtags).
 */
export const ARTICLE_TEASERS = {
  171: {
    tags: 'tsx30, mining',
    image: 'https://www.tmx.com/assets/application/img/ugc/blog/original/tsx30-thumb-pov.jpg',
  },
  170: {
    tags: 'pov',
    image: 'https://www.tmx.com/assets/application/img/ugc/blog/sign-tsx30-thumb.jpg',
  },
  169: {
    tags: 'pov',
    image: 'https://www.tmx.com/assets/application/img/ugc/blog/rob-tsx30-thumb.jpg',
  },
  168: {
    tags: 'pov, life-sciences',
    image: 'https://www.tmx.com/assets/application/img/ugc/blog/tmx-pov-thumb3.jpg',
  },
};

/** Local media file name for a source image URL (strips cache-busting stamps). */
export function mediaName(src) {
  const name = new URL(src, SOURCE).pathname.split('/').pop();
  return name
    .replace(/\.\d{10}\./, '.')
    .replace(/_/g, '-')
    .replace(/^tmx-logo-dark/, 'tmx-logo');
}

/** Maps a source href to its new URL: migrated pages move to SITE, the rest stay on tmx.com. */
export function mapHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  const url = new URL(href, SOURCE);
  if (url.hostname === 'www.tmx.com' || url.hostname === 'tmx.com') {
    const key = `${url.pathname.replace(/\/$/, '') || '/'}${url.search}`;
    if (MIGRATED[key]) return `${SITE}${MIGRATED[key]}`;
    return `${SOURCE}${url.pathname}${url.search}${url.hash}`;
  }
  return url.href;
}

export function el(document, tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

export function link(document, href, text) {
  return el(document, 'a', text, { href: mapHref(href) });
}

/** <img> pointing at the locally hosted copy of a source image. */
export function image(document, src, alt = '') {
  return el(document, 'img', '', { src: `${MEDIA}/${mediaName(src)}`, alt });
}

/** Wraps nodes in a new element. */
export function wrap(document, tag, ...children) {
  const node = document.createElement(tag);
  node.append(...children.filter(Boolean));
  return node;
}

/** A paragraph holding a single button-style link (strong = primary, em = secondary). */
export function buttonLink(document, href, text, style = 'em') {
  return wrap(document, 'p', wrap(document, style, link(document, href, text)));
}

/** Clones source content, rewriting links (and dropping target/rel and classes). */
export function cloneContent(document, node) {
  const clone = node.cloneNode(true);
  const all = clone.querySelectorAll ? [clone, ...clone.querySelectorAll('*')] : [clone];
  all.forEach((n) => {
    if (n.nodeType !== 1) return;
    ['class', 'style', 'id', 'target', 'rel'].forEach((a) => n.removeAttribute(a));
    if (n.tagName === 'A') n.setAttribute('href', mapHref(n.getAttribute('href')));
  });
  return clone;
}

export function block(document, name, cells) {
  return WebImporter.Blocks.createBlock(document, { name, cells });
}

/**
 * Metadata blocks at the top of articles. Each always emits every row, in this order, so the
 * table has the same shape on every page (empty rows are ignored when rendered).
 */
export const POV_KEYS = ['Title', 'Date', 'Tags', 'Image', 'Summary', 'Author'];
export const PRESS_RELEASE_KEYS = ['Title', 'Description', 'Date', 'City', 'Tags', 'Contact',
  'Related Document'];

const keyedBlock = (document, name, keys, values) => block(document, name, keys.map((key) => [key, values[key] || '']));

export const povMetadataBlock = (document, values) => keyedBlock(document, 'POV Metadata', POV_KEYS, values);

export const pressReleaseMetadataBlock = (document, values) => keyedBlock(document, 'Press Release Metadata', PRESS_RELEASE_KEYS, values);

/** Author / contact person block: keyed rows, same order on every author page. */
export const AUTHOR_KEYS = ['Photo', 'Name', 'Role', 'Phone', 'Email', 'Link'];

export const authorBlock = (document, values) => keyedBlock(document, 'Author', AUTHOR_KEYS, values);

/** A link to a page on this site (emitted on SITE, relativized after import). */
export function siteLink(document, path, label = `${SITE}${path}`) {
  return el(document, 'a', label, { href: `${SITE}${path}` });
}

export function sectionMetadata(document, style) {
  return block(document, 'Section Metadata', [['style', style]]);
}

export function metadata(document, values) {
  return WebImporter.Blocks.getMetadataBlock(document, values);
}

/**
 * Builds a new <main> from sections. Each section is an array of nodes; sections are
 * separated by <hr> (section breaks).
 */
export function buildMain(document, sections) {
  const main = document.createElement('main');
  sections.forEach((nodes, i) => {
    if (i > 0) main.append(document.createElement('hr'));
    main.append(...nodes.filter(Boolean));
  });
  return main;
}

export const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const text = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');
