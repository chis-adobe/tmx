/**
 * Shared POV (article) data and card rendering, used by the news-and-insights, pov-cards and
 * pov-search blocks.
 *
 * A POV's card data comes from the POV query index (/povs/query-index.json). Pages that are not
 * in the index yet (e.g. only previewed) fall back to the page's own metadata, read from its
 * <head>: og:title, description, og:image, date, article:tag (tags) and author.
 * Tags are kept as taxonomy keys (scripts/taxonomy.js) and shown as "#Label" on cards.
 */
import { createPicture, resolveContentPath } from './scripts.js';
import { formatTag, loadTaxonomy, tagKeys } from './taxonomy.js';

export const POV_INDEX = '/povs/query-index.json';

const indexCache = new Map();
const pageCache = new Map();

/**
 * Same-origin path for an authored link, or null when it is not a page on this site.
 * Links to this site's aem.page / aem.live hosts count as same-site.
 * @param {string} href
 * @returns {string|null}
 */
export function toSitePath(href) {
  try {
    const url = new URL(href, window.location.href);
    const sameSite = url.origin === window.location.origin
      || url.hostname.endsWith('.aem.page') || url.hostname.endsWith('.aem.live');
    if (!sameSite) return null;
    const path = url.pathname.replace(/\.(plain\.)?html$/, '').replace(/^\/content\//, '/');
    return path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}

/** Image URLs on this site's hosts become paths, so they are optimized on any host. */
function normalizeImage(src) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.href);
    if (url.hostname.endsWith('.aem.page') || url.hostname.endsWith('.aem.live')
      || url.origin === window.location.origin) return url.pathname;
    return url.href;
  } catch {
    return '';
  }
}

function toPov(row) {
  return {
    path: row.path,
    title: row.title || '',
    description: row.description || '',
    image: normalizeImage(row.image),
    date: row.date || '',
    tags: tagKeys(row.tags),
    author: row.author || '',
  };
}

/**
 * Loads all rows of a query index (following pagination). Resolves to [] when the index does
 * not exist or cannot be read.
 * @param {string} [source] Index URL path
 * @returns {Promise<object[]>}
 */
export function loadPovIndex(source = POV_INDEX) {
  if (!indexCache.has(source)) {
    const load = async () => {
      await loadTaxonomy();
      const rows = [];
      let offset = 0;
      // the index API pages results; stop on the last page (or after a sane upper bound)
      for (let page = 0; page < 20; page += 1) {
        const resp = await fetch(`${resolveContentPath(source.replace(/\.json$/, ''))}.json?offset=${offset}&limit=500`);
        if (!resp.ok) break;
        const json = await resp.json();
        const data = Array.isArray(json.data) ? json.data : [];
        rows.push(...data);
        offset += data.length;
        if (!data.length || offset >= (json.total || 0)) break;
      }
      return rows.filter((row) => typeof row.path === 'string').map(toPov);
    };
    indexCache.set(source, load().catch(() => []));
  }
  return indexCache.get(source);
}

/** Reads card data from a page's <head> (its metadata), for pages not in the index. */
function loadFromPage(path) {
  if (!pageCache.has(path)) {
    const request = loadTaxonomy()
      .then(() => fetch(resolveContentPath(path)))
      .then((resp) => (resp.ok ? resp.text() : null))
      .then((html) => {
        if (!html) return null;
        // parsed inertly: scripts never run, only meta values and the h1 text are read
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const meta = (name) => doc.head.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content || '';
        const title = meta('og:title') || doc.querySelector('h1')?.textContent.trim() || '';
        if (!title) return null;
        return toPov({
          path,
          title,
          description: meta('description'),
          image: meta('og:image'),
          date: meta('date'),
          tags: meta('article:tag') || meta('tags'),
          author: meta('author'),
        });
      })
      .catch(() => null);
    pageCache.set(path, request);
  }
  return pageCache.get(path);
}

/**
 * Card data for one POV page: its query index row, else its page metadata.
 * @param {string} path Site path, e.g. /povs/my-article
 * @returns {Promise<object|null>}
 */
export async function loadPov(path) {
  const index = await loadPovIndex();
  return index.find((row) => row.path === path) || loadFromPage(path);
}

/**
 * Heading level for card titles: one below the closest heading before the element.
 * @param {Element} el
 * @returns {number}
 */
export function cardHeadingLevel(el) {
  const main = el.closest('main') || document.body;
  const previous = [...main.querySelectorAll('h1, h2, h3, h4, h5')].filter(
    // eslint-disable-next-line no-bitwise
    (h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).pop();
  const level = previous ? Number(previous.tagName.substring(1)) + 1 : 2;
  return Math.min(Math.max(level, 2), 6);
}

function textEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

/** Tag keys as TMX hashtags ("#Mining"), labels from the taxonomy. */
function tagList(tags) {
  const ul = document.createElement('ul');
  ul.className = 'pov-card-tags';
  tags.forEach((key) => ul.append(textEl('li', '', formatTag(key, { hash: true }))));
  return ul;
}

/**
 * Field order per card layout:
 *   teaser — vertical: image, title, description (clamped to two lines)
 *   large  — vertical: image, title, tags, date, description
 *   small  — horizontal: image beside title, date, tags
 */
const LAYOUTS = {
  teaser: ['title', 'description'],
  large: ['title', 'tags', 'date', 'description'],
  small: ['title', 'date', 'tags'],
};

/**
 * Renders a POV card (a link wrapping image and text). With no data, renders a plain link card
 * from the authored link so a missing reference never breaks the page.
 * @param {object|null} pov Card data from loadPov / loadPovIndex
 * @param {object} options
 * @param {'teaser'|'large'|'small'} options.layout
 * @param {number} options.headingLevel
 * @param {HTMLAnchorElement} [options.fallbackLink]
 * @param {boolean} [options.eager] Load the image eagerly (above the fold)
 * @returns {HTMLAnchorElement}
 */
export function renderPovCard(pov, {
  layout = 'small', headingLevel = 3, fallbackLink, eager = false,
} = {}) {
  const a = document.createElement('a');
  a.className = `pov-card pov-card-${layout}`;
  a.href = pov ? resolveContentPath(pov.path) : fallbackLink?.href || '#';

  if (pov?.image) {
    const media = document.createElement('div');
    media.className = 'pov-card-image';
    const width = layout === 'small' ? '400' : '750';
    media.append(createPicture(pov.image, '', eager, [{ width }]));
    a.append(media);
  }

  const body = document.createElement('div');
  body.className = 'pov-card-body';
  const title = pov?.title || fallbackLink?.textContent.trim() || '';
  (pov ? LAYOUTS[layout] : ['title']).forEach((field) => {
    if (field === 'title') body.append(textEl(`h${headingLevel}`, 'pov-card-title', title));
    if (field === 'tags' && pov.tags.length) body.append(tagList(pov.tags));
    if (field === 'date' && pov.date) body.append(textEl('p', 'pov-card-date', pov.date));
    if (field === 'description' && pov.description) body.append(textEl('p', 'pov-card-description', pov.description));
  });
  a.append(body);
  if (!pov) a.classList.add('pov-card-fallback');
  return a;
}

/**
 * Loads card data for authored article links, keeping the authored order. Missing or failed
 * references resolve to null (rendered as fallback link cards).
 * @param {HTMLAnchorElement[]} links
 * @returns {Promise<Array<object|null>>}
 */
export function loadPovsForLinks(links) {
  return Promise.all(links.map(async (link) => {
    const path = toSitePath(link.href);
    if (!path) return null;
    try {
      return await loadPov(path);
    } catch {
      return null;
    }
  }));
}
