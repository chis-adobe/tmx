/**
 * POV template (POV articles and the POV listing).
 * `metadata` holds defaults applied to every page on this template (page metadata wins),
 * so authors don't have to wire the shared header and footer fragments on each page.
 *
 * A POV article's data lives in its page metadata (Date, Tags, Image, Description, Author);
 * Tags holds taxonomy keys (scripts/taxonomy.js).
 * This template renders the "date | tags" line under the title and adds the Author's card
 * (their /authors/ page, loaded as a fragment) right after the article text. Pages that still
 * use a POV Metadata block keep working: the block renders the header and its Author row wins.
 */
import { getMetadata } from '../../scripts/aem.js';
import { buildFragmentBlock, cellHasValue, readKeyedRows } from '../../scripts/scripts.js';
import { formatTag, loadTaxonomy, tagKeys } from '../../scripts/taxonomy.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

/** A cell holding a link, so page metadata can reuse buildFragmentBlock. */
function linkCell(href) {
  const cell = document.createElement('div');
  const a = document.createElement('a');
  a.href = href;
  cell.append(a);
  return cell;
}

/**
 * "date | tags" line built from page metadata, placed right after the h1. It is a paragraph
 * (default content), so page decoration does not mistake it for a block. Tags are taxonomy keys,
 * shown as TMX hashtags ("#Mining") once the labels have loaded, without delaying the page.
 */
function addByline(h1) {
  const date = getMetadata('date');
  const tagsValue = getMetadata('article:tag') || getMetadata('tags');
  if (!date && !tagsValue) return;
  const byline = document.createElement('p');
  byline.className = 'pov-byline';
  if (date) {
    const span = document.createElement('span');
    span.className = 'pov-byline-date';
    span.textContent = date;
    byline.append(span);
  }
  h1.after(byline);
  if (!tagsValue) return;
  loadTaxonomy().then(() => {
    tagKeys(tagsValue).forEach((key) => {
      const span = document.createElement('span');
      span.className = 'pov-byline-tag';
      span.textContent = formatTag(key, { hash: true });
      byline.append(span);
    });
  });
}

/** Runs before the page is decorated, on the raw (authored) DOM. */
export default function decorate(main) {
  const block = main.querySelector(':scope > div > div.pov-metadata');
  const h1 = main.querySelector(':scope > div > h1');
  if (!block && h1) addByline(h1);

  // the author reference: POV Metadata block row, else the page's Author metadata
  const blockAuthor = block && readKeyedRows(block).get('author');
  const metaAuthor = getMetadata('author');
  let authorCell = null;
  if (cellHasValue(blockAuthor)) authorCell = blockAuthor;
  else if (metaAuthor) authorCell = linkCell(metaAuthor);
  if (!authorCell) return;

  const fragment = buildFragmentBlock(authorCell);
  const articleSection = (block || h1)?.parentElement;
  if (!fragment || !articleSection) return;
  const section = document.createElement('div');
  section.append(fragment);
  articleSection.after(section);
}
