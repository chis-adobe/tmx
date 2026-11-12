import { toClassName } from '../../scripts/aem.js';

/**
 * Press Release Metadata block — the key/value table at the top of a press release.
 *
 * Rows (key in the first cell, value in the second; empty rows are ignored):
 *   Title, Description, Date, City, Tags, Contact, Related Document
 *
 * Renders the release header: title (the page's h1), "date | tags" line and the bold
 * description. The press-release template places City (dateline), Related Document and Contact
 * around the release text (templates/press-release/press-release.js).
 */

const HEADER_KEYS = ['title', 'date', 'tags', 'description'];
const KEY_ALIASES = { 'related-doc': 'related-document' };

function tagList(value) {
  const tags = value.textContent.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  if (!tags.length) return null;
  const list = document.createElement('ul');
  list.className = 'press-release-metadata-tag-list';
  tags.forEach((tag) => {
    const li = document.createElement('li');
    li.textContent = tag;
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
 * @param {Element} block The press-release-metadata block
 */
export default function decorate(block) {
  const rows = new Map();
  [...block.children].forEach((row) => {
    const [label, value] = row.children;
    let key = toClassName(label?.textContent || '');
    key = KEY_ALIASES[key] || key;
    const empty = !value || !value.textContent.trim();
    row.classList.add('press-release-metadata-row');
    if (key) row.classList.add(`press-release-metadata-${key}`);
    if (empty || !HEADER_KEYS.includes(key)) {
      row.hidden = true;
      return;
    }
    label.classList.add('press-release-metadata-label');
    value.classList.add('press-release-metadata-value');
    rows.set(key, { row, value });
  });

  const title = rows.get('title');
  if (title) title.value.replaceChildren(titleHeading(title.value));

  const tags = rows.get('tags');
  const list = tags && tagList(tags.value);
  if (list) tags.value.replaceChildren(list);

  const meta = document.createElement('div');
  meta.className = 'press-release-metadata-meta';
  ['date', 'tags'].forEach((key) => { if (rows.has(key)) meta.append(rows.get(key).row); });

  block.prepend(...[title?.row, meta.children.length ? meta : null, rows.get('description')?.row]
    .filter(Boolean));
}
