/**
 * Press release template.
 * `metadata` holds defaults applied to every page on this template (page metadata wins).
 *
 * Press releases start with a Press Release Metadata block (Title, Description, Date, City, Tags,
 * Contact, Related Document). The block renders the header; this template places the rest
 * around the release text:
 *   - City: dateline at the start of the first paragraph — "November 10, 2026 (TORONTO) – …"
 *   - Related Document: link right after the release text
 *   - Contact: "contact" label + the contact's card (their /authors/ page) at the bottom
 * The "About TMX Group" boilerplate is a /disclaimers/ fragment authored on the page.
 * Labels come from the placeholders sheet (keys "related-document" and "contact").
 */
import {
  buildFragmentBlock, cellHasValue, fetchPlaceholders, readKeyedRows,
} from '../../scripts/scripts.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

/** An element whose text comes from the placeholders sheet (removed if the key is missing). */
function label(tag, className, placeholderKey) {
  const el = document.createElement(tag);
  el.className = className;
  // filled in without delaying the first paint
  fetchPlaceholders().then((placeholders) => {
    if (placeholders[placeholderKey]) el.textContent = placeholders[placeholderKey];
    else el.remove();
  });
  return el;
}

/** Prefixes "{date} ({city}) – " to the first paragraph of the release text. */
function addDateline(section, block, date, city) {
  const first = [...section.children]
    .find((el) => el !== block && el.tagName === 'P' && el.textContent.trim());
  if (!first) return;
  const dateline = document.createElement('span');
  dateline.className = 'press-release-dateline';
  const cityEl = document.createElement('span');
  cityEl.className = 'press-release-dateline-city';
  cityEl.textContent = city;
  dateline.append(date ? `${date} (` : '(', cityEl, ') – ');
  first.prepend(dateline);
}

function relatedDocument(cell) {
  const link = cell.querySelector('a[href]');
  if (!link) return null;
  const p = document.createElement('p');
  p.className = 'press-release-related';
  const a = link.cloneNode(true);
  a.removeAttribute('class');
  p.append(label('strong', 'press-release-related-label', 'relatedDocument'), document.createElement('br'), a);
  return p;
}

/** Runs before the page is decorated, on the raw (authored) DOM. */
export default function decorate(main) {
  const block = main.querySelector(':scope > div > div.press-release-metadata');
  if (!block) return;
  const section = block.parentElement;
  const rows = readKeyedRows(block);
  const get = (key) => (cellHasValue(rows.get(key)) ? rows.get(key) : null);
  const related = get('related-document') || get('related-doc');

  if (get('city')) addDateline(section, block, get('date')?.textContent.trim() || '', get('city').textContent.trim());

  const doc = related && relatedDocument(related);
  if (doc) section.append(doc);

  const contact = get('contact') && buildFragmentBlock(get('contact'));
  if (contact) {
    const contactSection = document.createElement('div');
    contactSection.className = 'press-release-contact';
    contactSection.append(label('p', 'press-release-contact-label', 'contact'), contact);
    main.append(contactSection);
  }
}
