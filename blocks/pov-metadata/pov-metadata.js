import { toClassName } from '../../scripts/aem.js';
import { formatTag, loadTaxonomy, tagKeys } from '../../scripts/taxonomy.js';

/**
 * POV Metadata block — the key/value table at the top of a POV article.
 *
 * Rows (key in the first cell, value in the second; empty rows are ignored):
 *   Title, Date, Tags, Image, Summary, Author
 *
 * Renders the article header: title (the page's h1) and a "date | tags" line. Image and
 * Summary feed article cards (News and Insights); the pov template shows the Author's card
 * after the article text (templates/pov/pov.js).
 */

const HEADER_KEYS = ['title', 'date', 'tags'];

function tagList(value) {
  // taxonomy keys, shown with their approved labels
  const tags = tagKeys(value.textContent);
  if (!tags.length) return null;
  const list = document.createElement('ul');
  list.className = 'pov-metadata-tag-list';
  tags.forEach((key) => {
    const li = document.createElement('li');
    li.textContent = formatTag(key, { hash: true });
    list.append(li);
  });
  return list;
}

function titleHeading(value) {
  const h1 = document.createElement('h1');
  const source = value.querySelector('h1, h2, h3, h4, h5, h6, p');
  h1.append(...(source || value).childNodes);
  if (source?.id) h1.id = source.id;
  return h1;
}

/**
 * @param {Element} block The pov-metadata block
 */
export default async function decorate(block) {
  await loadTaxonomy();
  const rows = new Map();
  [...block.children].forEach((row) => {
    const [label, value] = row.children;
    const key = toClassName(label?.textContent || '');
    const empty = !value || (!value.textContent.trim() && !value.querySelector('img'));
    row.classList.add('pov-metadata-row');
    if (key) row.classList.add(`pov-metadata-${key}`);
    if (empty || !HEADER_KEYS.includes(key)) {
      row.hidden = true;
      return;
    }
    label.classList.add('pov-metadata-label');
    value.classList.add('pov-metadata-value');
    rows.set(key, { row, value });
  });

  const title = rows.get('title');
  if (title) title.value.replaceChildren(titleHeading(title.value));

  const tags = rows.get('tags');
  const list = tags && tagList(tags.value);
  if (list) tags.value.replaceChildren(list);

  const meta = document.createElement('div');
  meta.className = 'pov-metadata-meta';
  ['date', 'tags'].forEach((key) => { if (rows.has(key)) meta.append(rows.get(key).row); });

  block.prepend(...[title?.row, meta.children.length ? meta : null].filter(Boolean));
}
