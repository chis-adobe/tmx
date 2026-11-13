import { moveInstrumentation } from '../../scripts/scripts.js';
import { cardHeadingLevel, loadPovsForLinks, renderPovCard } from '../../scripts/pov.js';

/**
 * News and Insights block.
 *
 * Authors only supply links to article pages (one or more, in any rows/cells). For each link the
 * block loads the referenced article's data (POV query index, else the article's page metadata)
 * and renders a card: image, title and description clamped to two lines (the "featured"
 * option renders large cards instead). The card layout is enforced by the block; authors cannot
 * change it. A missing or failed reference degrades to a plain link card.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const headingLevel = cardHeadingLevel(block);
  const layout = block.classList.contains('featured') ? 'large' : 'teaser';
  const list = document.createElement('ul');

  // one card per authored link; the row's instrumentation moves to its first card
  const entries = [];
  [...block.children].forEach((row) => {
    [...row.querySelectorAll('a[href]')].forEach((link, i) => {
      const li = document.createElement('li');
      if (i === 0) moveInstrumentation(row, li);
      list.append(li);
      entries.push({ li, link: link.cloneNode(true) });
    });
  });
  block.replaceChildren(list);

  const povs = await loadPovsForLinks(entries.map(({ link }) => link));
  entries.forEach(({ li, link }, i) => {
    li.append(renderPovCard(povs[i], { layout, headingLevel, fallbackLink: link }));
  });
}
