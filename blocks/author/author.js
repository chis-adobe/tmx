import { toClassName } from '../../scripts/aem.js';
import { createPicture, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Author block — a person card used for article authors and press-release contacts.
 *
 * Rows (key in the first cell, value in the second; empty rows are ignored):
 *   Photo, Name, Role, Phone, Email, Link
 * Older one-column author tables (photo, name, role, link — by position) still work.
 */

const ORDERED_KEYS = ['photo', 'name', 'role', 'link'];
const KEY_ALIASES = { image: 'photo', picture: 'photo', title: 'role' };

function wrapInLink(el, href) {
  const a = document.createElement('a');
  a.href = href;
  el.replaceWith(a);
  a.append(el);
}

/** Reads rows into key -> { row, cell }, for keyed (2-column) or legacy ordered tables. */
function readRows(block) {
  const rows = [...block.children];
  const keyed = rows.some((row) => row.children.length >= 2);
  const map = new Map();
  rows.forEach((row, i) => {
    let key;
    let cell;
    if (keyed) {
      const [label, value] = row.children;
      key = toClassName(label?.textContent || '');
      key = KEY_ALIASES[key] || key;
      cell = value;
      label?.remove();
    } else {
      key = ORDERED_KEYS[i];
      [cell] = row.children;
    }
    const empty = !cell || (!cell.textContent.trim() && !cell.querySelector('img'));
    if (!key || empty) {
      row.remove();
      return;
    }
    map.set(key, { row, cell });
  });
  return map;
}

function decoratePhoto({ row }, name, profileUrl) {
  row.className = 'author-photo';
  const img = row.querySelector('img');
  if (!img) return;
  const picture = createPicture(img.src, name, false, [{ width: '240' }]);
  moveInstrumentation(img, picture.querySelector('img'));
  (img.closest('picture') || img).replaceWith(picture);
  if (profileUrl) wrapInLink(picture, profileUrl);
}

function decorateName({ row, cell }, profileUrl) {
  row.className = 'author-name';
  if (!profileUrl || row.querySelector('a')) return;
  const target = cell.querySelector('p, h2, h3, h4, h5, h6') || cell;
  const a = document.createElement('a');
  a.href = profileUrl;
  a.append(...target.childNodes);
  target.append(a);
}

/** Turns a plain email address or phone number into a mailto:/tel: link. */
function decorateContact({ row, cell }, key) {
  row.className = `author-${key}`;
  if (cell.querySelector('a')) return;
  const target = cell.querySelector('p') || cell;
  const value = target.textContent.trim();
  const a = document.createElement('a');
  a.href = key === 'email' ? `mailto:${value}` : `tel:${value.replace(/[^\d+]/g, '')}`;
  a.textContent = value;
  target.replaceChildren(a);
}

/**
 * @param {Element} block The author block
 */
export default function decorate(block) {
  const rows = readRows(block);
  const name = rows.get('name')?.cell.textContent.trim() || '';
  const profileUrl = rows.get('link')?.cell.querySelector('a[href]')?.href || '';

  if (rows.has('photo')) decoratePhoto(rows.get('photo'), name, profileUrl);
  else block.classList.add('author-no-photo');
  if (rows.has('name')) decorateName(rows.get('name'), profileUrl);
  if (rows.has('role')) rows.get('role').row.className = 'author-title';
  ['phone', 'email'].forEach((key) => { if (rows.has(key)) decorateContact(rows.get(key), key); });
  if (rows.has('link')) rows.get('link').row.className = 'author-link';

  // display order: photo, name, role, phone, email, link
  ['photo', 'name', 'role', 'phone', 'email', 'link']
    .filter((key) => rows.has(key))
    .forEach((key) => block.append(rows.get(key).row));
}
