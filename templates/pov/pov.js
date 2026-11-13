/**
 * POV template (POV articles and the POV listing).
 * `metadata` holds defaults applied to every page on this template (page metadata wins),
 * so authors don't have to wire the shared header and footer fragments on each page.
 *
 * A POV article's data lives in its page metadata (Date, Tags, Image, Description, Author).
 * This template renders the "date | tags" line under the title and adds the Author's card
 * (their /authors/ page, loaded as a fragment) right after the article text. Pages that still
 * use a POV Metadata block keep working: the block renders the header and its Author row wins.
 */
import { getMetadata } from '../../scripts/aem.js';
import { buildFragmentBlock, cellHasValue, readKeyedRows } from '../../scripts/scripts.js';
import { splitTags } from '../../scripts/pov.js';

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

/** "date | tags" line built from page metadata, placed right after the h1. */
function addByline(h1) {
  const date = getMetadata('date');
  const tags = splitTags(getMetadata('article:tag') || getMetadata('tags'));
  if (!date && !tags.length) return;
  const byline = document.createElement('div');
  byline.className = 'pov-byline';
  if (date) {
    const p = document.createElement('p');
    p.className = 'pov-byline-date';
    p.textContent = date;
    byline.append(p);
  }
  if (tags.length) {
    const ul = document.createElement('ul');
    ul.className = 'pov-byline-tags';
    tags.forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = tag;
      ul.append(li);
    });
    byline.append(ul);
  }
  h1.after(byline);
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
