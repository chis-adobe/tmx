/**
 * Article layout shared by the article templates (pov, press-release).
 *
 * Authors write an Article block (key/value rows) at the top of the page, then the article as
 * free text. The Article block renders the header (title, date, tags, description) itself; this
 * module places the remaining details around the free text, before the page is decorated:
 *   - City: prefixed to the first paragraph, after the date — "November 10, 2026 (TORONTO) – …"
 *   - Related Document: link paragraph right after the article text
 *   - Author: author card (fragment) right after the article section
 *   - Contact: "contact" label + author card (fragment) at the very bottom of the page
 * Labels come from the placeholders sheet (keys "related-document" and "contact").
 */
import { toClassName } from './aem.js';
import { fetchPlaceholders } from './scripts.js';

/** Row keys the layout understands. "related-doc" is accepted as a short form. */
const KEY_ALIASES = { 'related-doc': 'related-document' };

/**
 * Reads the raw (undecorated) Article block into a map of key -> value cell.
 * @param {Element} block
 * @returns {Map<string, Element>}
 */
export function readArticleRows(block) {
  const rows = new Map();
  [...block.children].forEach((row) => {
    const [label, value] = row.children;
    if (!label || !value) return;
    const key = toClassName(label.textContent);
    if (key) rows.set(KEY_ALIASES[key] || key, value);
  });
  return rows;
}

const hasValue = (cell) => !!cell && (cell.textContent.trim() !== '' || !!cell.querySelector('img'));

/** A raw fragment block (decorated later like any authored one) pointing at the cell's link. */
function fragmentBlock(cell) {
  const raw = cell.querySelector('a[href]')?.getAttribute('href');
  if (!raw) return null;
  // fragments load from this site only: keep the path of same-site / aem.page / aem.live links
  const url = new URL(raw, window.location.href);
  const sameSite = url.hostname === window.location.hostname
    || url.hostname.endsWith('.aem.page') || url.hostname.endsWith('.aem.live');
  if (!sameSite) return null;
  const href = url.pathname;
  const block = document.createElement('div');
  block.className = 'fragment';
  const row = document.createElement('div');
  const col = document.createElement('div');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  col.append(a);
  row.append(col);
  block.append(row);
  return block;
}

function labelElement(tag, className, placeholderKey) {
  const label = document.createElement(tag);
  label.className = className;
  // filled in without delaying the first paint; empty until the placeholders sheet arrives
  fetchPlaceholders().then((placeholders) => {
    if (placeholders[placeholderKey]) label.textContent = placeholders[placeholderKey];
    else label.remove();
  });
  return label;
}

/** Prefixes "{date} ({city}) – " to the first paragraph of the article text. */
function prefixCity(section, block, date, city) {
  const first = [...section.children].find((el) => el !== block && el.tagName === 'P' && el.textContent.trim());
  if (!first) return;
  const dateline = document.createElement('span');
  dateline.className = 'article-dateline';
  const cityEl = document.createElement('span');
  cityEl.className = 'article-city';
  cityEl.textContent = city;
  dateline.append(date ? `${date} (` : '(', cityEl, ') – ');
  first.prepend(dateline);
}

function relatedDocument(cell) {
  const link = cell.querySelector('a[href]');
  if (!link) return null;
  const p = document.createElement('p');
  p.className = 'article-related-document';
  const label = labelElement('strong', 'article-related-document-label', 'relatedDocument');
  const a = link.cloneNode(true);
  a.removeAttribute('class');
  p.append(label, document.createElement('br'), a);
  return p;
}

function newSection(...children) {
  const section = document.createElement('div');
  section.append(...children.filter(Boolean));
  return section;
}

/**
 * Lays out an article page around its Article block. Call from a template's decorate(main),
 * which runs before the page is decorated.
 * @param {Element} main The main element
 */
export default function decorateArticleLayout(main) {
  const block = main.querySelector(':scope > div > div.article');
  if (!block) return;
  const section = block.parentElement;
  const rows = readArticleRows(block);
  const text = (key) => (hasValue(rows.get(key)) ? rows.get(key).textContent.trim() : '');

  if (text('city')) prefixCity(section, block, text('date'), text('city'));

  if (hasValue(rows.get('related-document'))) {
    const doc = relatedDocument(rows.get('related-document'));
    if (doc) section.append(doc);
  }

  if (hasValue(rows.get('author'))) {
    const author = fragmentBlock(rows.get('author'));
    if (author) section.after(newSection(author));
  }

  if (hasValue(rows.get('contact'))) {
    const contact = fragmentBlock(rows.get('contact'));
    if (contact) {
      const label = labelElement('p', 'article-contact-label', 'contact');
      const contactSection = newSection(label, contact);
      contactSection.classList.add('article-contact');
      main.append(contactSection);
    }
  }
}
