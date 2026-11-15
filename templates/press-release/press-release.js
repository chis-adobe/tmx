/**
 * Press release template.
 * `metadata` holds defaults applied to every page on this template (page metadata wins).
 *
 * A press release is its headline (the page's first heading) and the release text, then the
 * "About TMX Group" disclaimer fragment. Its details live in the page Metadata block:
 *   Date, Tags        -> "date | tags" line under the headline (Tags are taxonomy keys)
 *   Blurb             -> bold line under the headline (e.g. the marketplaces it covers)
 *   City              -> dateline at the start of the text: "November 10, 2026 (TORONTO) – …"
 *   Related Document  -> PDF link right after the text (link text: Related Document Title, or
 *                        the headline)
 *   Contact           -> "contact" label + the contact's card (their /authors/ page) at the
 *                        bottom of the page
 * Pages that still use a Press Release Metadata block keep working: the block renders the
 * header and its rows are used for the rest.
 * Labels come from the placeholders sheet (keys "related-document" and "contact").
 */
import { getMetadata } from '../../scripts/aem.js';
import {
  buildFragmentBlock, cellHasValue, fetchPlaceholders, readKeyedRows,
} from '../../scripts/scripts.js';
import { formatTag, loadTaxonomy, tagKeys } from '../../scripts/taxonomy.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** A cell holding a link, so page metadata values can reuse the block-cell helpers. */
function linkCell(href, text = href) {
  const cell = document.createElement('div');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  cell.append(a);
  return cell;
}

/** An element whose text comes from the placeholders sheet (removed if the key is missing). */
function label(tag, className, placeholderKey) {
  const node = el(tag, className);
  // filled in without delaying the first paint
  fetchPlaceholders().then((placeholders) => {
    if (placeholders[placeholderKey]) node.textContent = placeholders[placeholderKey];
    else node.remove();
  });
  return node;
}

/** "date | tags" line under the headline, as a paragraph (stays default content). */
function addHeader(h1, date, tagsValue, blurb) {
  const nodes = [];
  if (date || tagsValue) {
    const line = el('p', 'press-release-meta');
    if (date) line.append(el('span', 'press-release-meta-date', date));
    nodes.push(line);
    if (tagsValue) {
      loadTaxonomy().then(() => {
        tagKeys(tagsValue).forEach((key) => line.append(el('span', 'press-release-meta-tag', formatTag(key))));
      });
    }
  }
  if (blurb) nodes.push(el('p', 'press-release-blurb', blurb));
  h1.after(...nodes);
}

/** Prefixes "{date} ({city}) – " to the first paragraph of the release text. */
function addDateline(first, date, city) {
  const dateline = el('span', 'press-release-dateline');
  dateline.append(date ? `${date} (` : '(', el('span', 'press-release-dateline-city', city), ') – ');
  first.prepend(dateline);
}

function relatedDocument(cell, text) {
  const link = cell.querySelector('a[href]');
  if (!link) return null;
  const p = el('p', 'press-release-related');
  const a = link.cloneNode(true);
  a.removeAttribute('class');
  if (text) a.textContent = text;
  p.append(label('strong', 'press-release-related-label', 'relatedDocument'), document.createElement('br'), a);
  return p;
}

/**
 * The release's details: from a Press Release Metadata block when the page has one, else from
 * the page metadata.
 */
function readDetails(main) {
  const block = main.querySelector(':scope > div > div.press-release-metadata');
  if (block) {
    const rows = readKeyedRows(block);
    const get = (key) => (cellHasValue(rows.get(key)) ? rows.get(key) : null);
    return {
      block,
      section: block.parentElement,
      date: get('date')?.textContent.trim() || '',
      city: get('city')?.textContent.trim() || '',
      related: get('related-document') || get('related-doc'),
      contact: get('contact'),
    };
  }
  const h1 = main.querySelector(':scope > div > h1');
  if (!h1) return null;
  const related = getMetadata('related-document');
  const contact = getMetadata('contact');
  return {
    h1,
    section: h1.parentElement,
    date: getMetadata('date'),
    city: getMetadata('city'),
    related: related ? linkCell(related) : null,
    relatedTitle: getMetadata('related-document-title') || h1.textContent.trim(),
    contact: contact ? linkCell(contact) : null,
  };
}

/** Runs before the page is decorated, on the raw (authored) DOM. */
export default function decorate(main) {
  const details = readDetails(main);
  if (!details) return;
  const { section } = details;
  const start = details.block || details.h1;

  // the release text starts at the first paragraph after the headline / block
  const children = [...section.children];
  const first = children.slice(children.indexOf(start) + 1)
    .find((node) => node.tagName === 'P' && node.textContent.trim());

  if (details.h1) {
    addHeader(details.h1, details.date, getMetadata('article:tag') || getMetadata('tags'), getMetadata('blurb'));
  }

  if (details.city && first) addDateline(first, details.date, details.city);

  const doc = details.related && relatedDocument(details.related, details.relatedTitle);
  if (doc) section.append(doc);

  const contact = details.contact && buildFragmentBlock(details.contact);
  if (contact) {
    const contactSection = el('div', 'press-release-contact');
    contactSection.append(label('p', 'press-release-contact-label', 'contact'), contact);
    main.append(contactSection);
  }
}
