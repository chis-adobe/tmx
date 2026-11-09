import { readBlockConfig } from '../../scripts/aem.js';
import { createPicture, moveInstrumentation, resolveContentPath } from '../../scripts/scripts.js';

/**
 * News and Insights block.
 *
 * Authors only supply links to article pages (one or more, in any rows/cells). For each link the
 * block loads the referenced article, reads its `article` block (tags, date, teaser image,
 * summary) and title (h1), follows the article's author fragment to read the author's name,
 * and renders a card. The card layout is enforced by the block; authors cannot change it.
 * A missing or failed reference degrades to a plain link card instead of breaking the page.
 */

/** Cache of fetched documents, so one page referencing an article twice fetches it once. */
const documentCache = new Map();

/**
 * Returns a same-origin pathname for an authored link, or null if the link is not a page on
 * this site (absolute links to the current host are accepted).
 * @param {string} href
 * @returns {string|null}
 */
function toLocalPath(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname.replace(/\.(plain\.)?html$/, '').replace(/^\/content\//, '/');
    return path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}

/**
 * Fetches a page's plain HTML and parses it into an inert document (scripts never run and
 * nothing is inserted into the live page; only text and image URLs are read from it).
 * @param {string} path Same-origin path
 * @returns {Promise<Document|null>}
 */
function fetchDocument(path) {
  if (!documentCache.has(path)) {
    const request = fetch(`${resolveContentPath(path)}.plain.html`)
      .then((resp) => (resp.ok ? resp.text() : null))
      .then((html) => (html ? new DOMParser().parseFromString(html, 'text/html') : null))
      .catch(() => null);
    documentCache.set(path, request);
  }
  return documentCache.get(path);
}

/**
 * Reads the author's name from the author fragment an article references.
 * @param {Document} doc Article document
 * @param {string} articlePath Used to resolve relative links
 * @returns {Promise<string>}
 */
async function readAuthorName(doc, articlePath) {
  const base = new URL(articlePath, window.location.href);
  const link = [...doc.querySelectorAll('.fragment a[href], a[href*="/authors/"]')]
    .map((a) => toLocalPath(new URL(a.getAttribute('href'), base).href))
    .find(Boolean);
  if (!link) return '';
  const authorDoc = await fetchDocument(link);
  const nameRow = authorDoc?.querySelector('.author > div:nth-child(2)');
  return nameRow ? nameRow.textContent.trim() : '';
}

/**
 * Loads one referenced article and extracts the card data.
 * @param {string} path Article path
 * @returns {Promise<object|null>}
 */
async function loadArticle(path) {
  const doc = await fetchDocument(path);
  if (!doc) return null;
  const articleBlock = doc.querySelector('.article');
  const config = articleBlock ? readBlockConfig(articleBlock) : {};
  const title = doc.querySelector('h1')?.textContent.trim() || '';
  if (!title && !articleBlock) return null;

  const base = new URL(path, window.location.href);
  const img = articleBlock?.querySelector('img') || doc.querySelector('img');
  const imageSrc = img ? new URL(img.getAttribute('src'), base).href : '';

  const tagsValue = Array.isArray(config.tags) ? config.tags.join(' ') : (config.tags || '');
  const summary = Array.isArray(config.summary) ? config.summary.join(' ') : (config.summary || '');
  const author = await readAuthorName(doc, path);

  return {
    path,
    title,
    date: typeof config.date === 'string' ? config.date : '',
    tags: tagsValue.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean),
    summary,
    imageSrc,
    imageAlt: img?.getAttribute('alt') || '',
    author,
  };
}

/**
 * Heading level for card titles: one below the closest heading that precedes the block.
 * @param {Element} block
 * @returns {number}
 */
function cardHeadingLevel(block) {
  const main = block.closest('main') || document.body;
  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5')];
  const previous = headings.filter(
    // eslint-disable-next-line no-bitwise
    (h) => h.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).pop();
  const level = previous ? Number(previous.tagName.substring(1)) + 1 : 2;
  return Math.min(Math.max(level, 2), 6);
}

function createText(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

/**
 * Renders a card for a loaded article (or a fallback card from the authored link).
 */
function renderCard(li, data, link, headingLevel) {
  const a = document.createElement('a');
  a.className = 'news-and-insights-card';
  a.href = data ? resolveContentPath(data.path) : link.href;

  if (data?.imageSrc) {
    const media = document.createElement('div');
    media.className = 'news-and-insights-image';
    media.append(createPicture(data.imageSrc, data.imageAlt || data.title, false, [{ width: '750' }]));
    a.append(media);
  }

  const body = document.createElement('div');
  body.className = 'news-and-insights-body';
  if (data?.tags.length) {
    const tags = document.createElement('ul');
    tags.className = 'news-and-insights-tags';
    data.tags.forEach((tag) => tags.append(createText('li', '', tag)));
    body.append(tags);
  }
  body.append(createText(`h${headingLevel}`, 'news-and-insights-title', data?.title || link.textContent.trim()));

  const metaParts = [data?.date, data?.author].filter(Boolean);
  if (metaParts.length) {
    const meta = document.createElement('p');
    meta.className = 'news-and-insights-meta';
    if (data.date) meta.append(createText('span', 'news-and-insights-date', data.date));
    if (data.author) meta.append(createText('span', 'news-and-insights-author', data.author));
    body.append(meta);
  }
  if (data?.summary) body.append(createText('p', 'news-and-insights-summary', data.summary));

  a.append(body);
  li.replaceChildren(a);
  if (!data) li.classList.add('news-and-insights-fallback');
}

/**
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const headingLevel = cardHeadingLevel(block);
  const list = document.createElement('ul');

  // one card per authored link; the row's instrumentation moves to its first card
  const entries = [];
  [...block.children].forEach((row) => {
    [...row.querySelectorAll('a[href]')].forEach((link, i) => {
      const li = document.createElement('li');
      if (i === 0) moveInstrumentation(row, li);
      li.append(link.cloneNode(true));
      list.append(li);
      entries.push({ li, link, path: toLocalPath(link.href) });
    });
  });

  block.replaceChildren(list);

  await Promise.all(entries.map(async ({ li, link, path }) => {
    let data = null;
    try {
      data = path ? await loadArticle(path) : null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('news-and-insights: could not load', link.href, error);
    }
    renderCard(li, data, link, headingLevel);
  }));
}
