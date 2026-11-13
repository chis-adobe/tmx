import { moveInstrumentation } from '../../scripts/scripts.js';
import { cardHeadingLevel, loadPovsForLinks, renderPovCard } from '../../scripts/pov.js';

/** The block always shows one large card and at most this many small cards. */
const MAX_SMALL = 4;

/**
 * POV Cards block — the featured POVs on the POV landing page.
 *
 * Authors list links to POV pages. The first link becomes the large card (image, title, tags,
 * date, description, stacked); the next links, up to four, become small cards beside it
 * (image next to title, date, tags). Further links are ignored, so the layout always holds.
 * Card data is loaded from each POV (query index, else its page metadata).
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const headingLevel = cardHeadingLevel(block);
  const links = [];
  [...block.children].forEach((row) => {
    row.querySelectorAll('a[href]').forEach((link) => links.push({ row, link: link.cloneNode(true) }));
  });
  const used = links.slice(0, 1 + MAX_SMALL);

  const large = document.createElement('div');
  large.className = 'pov-cards-large';
  const small = document.createElement('ul');
  small.className = 'pov-cards-small';
  // keep Universal Editor instrumentation on the rendered cards
  if (used[0]) moveInstrumentation(used[0].row, large);

  const povs = await loadPovsForLinks(used.map(({ link }) => link));
  used.forEach(({ link }, i) => {
    if (i === 0) {
      large.append(renderPovCard(povs[i], {
        layout: 'large', headingLevel, fallbackLink: link, eager: true,
      }));
    } else {
      const li = document.createElement('li');
      li.append(renderPovCard(povs[i], { layout: 'small', headingLevel, fallbackLink: link }));
      small.append(li);
    }
  });

  block.replaceChildren(...[large, small.children.length ? small : null].filter(Boolean));
  block.classList.toggle('pov-cards-single', !small.children.length);
}
