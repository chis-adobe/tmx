import { createPicture, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Author block — one author profile, authored once (e.g. in /authors/{name}) and
 * included on articles through a fragment.
 *
 * Rows (one cell each): picture | name | title | LinkedIn link.
 * The photo and the name link to the profile URL; the image alt text is the author's name.
 */

/**
 * Wraps an element in a link to the profile, in place.
 * @param {Element} el
 * @param {string} href
 */
function wrapInLink(el, href) {
  const a = document.createElement('a');
  a.href = href;
  el.replaceWith(a);
  a.append(el);
}

function decoratePhoto(row, name, profileUrl) {
  row.className = 'author-photo';
  const img = row.querySelector('img');
  if (!img) {
    row.classList.add('author-photo-empty');
    return;
  }
  const picture = createPicture(img.src, name, false, [{ width: '240' }]);
  moveInstrumentation(img, picture.querySelector('img'));
  img.closest('picture').replaceWith(picture);
  if (profileUrl) wrapInLink(picture, profileUrl);
}

function decorateName(row, profileUrl) {
  row.className = 'author-name';
  if (!profileUrl || row.querySelector('a')) return;
  const cell = row.firstElementChild;
  // name text may arrive bare in the cell or wrapped in a <p>/heading
  const target = cell?.querySelector('p, h2, h3, h4, h5, h6') || cell;
  if (!target) return;
  const a = document.createElement('a');
  a.href = profileUrl;
  a.append(...target.childNodes);
  target.append(a);
}

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [pictureRow, nameRow, titleRow, linkRow] = [...block.children];
  const name = nameRow?.textContent.trim() || '';
  const profileUrl = linkRow?.querySelector('a[href]')?.href || '';

  if (pictureRow) decoratePhoto(pictureRow, name, profileUrl);
  if (nameRow) decorateName(nameRow, profileUrl);
  if (titleRow) titleRow.className = 'author-title';
  if (linkRow) linkRow.className = 'author-link';
}
