/**
 * POV template (POV articles and the POV listing).
 * `metadata` holds defaults applied to every page on this template (page metadata wins),
 * so authors don't have to wire the shared header and footer fragments on each page.
 *
 * POV articles start with a POV Metadata block (Title, Date, Tags, Image, Summary, Author). The
 * block renders the header; this template adds the Author's card (their /authors/ page, as a
 * fragment) right after the article section.
 */
import { buildFragmentBlock, cellHasValue, readKeyedRows } from '../../scripts/scripts.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

/** Runs before the page is decorated, on the raw (authored) DOM. */
export default function decorate(main) {
  const block = main.querySelector(':scope > div > div.pov-metadata');
  if (!block) return;
  const author = readKeyedRows(block).get('author');
  if (!cellHasValue(author)) return;
  const fragment = buildFragmentBlock(author);
  if (!fragment) return;
  const section = document.createElement('div');
  section.append(fragment);
  block.parentElement.after(section);
}
