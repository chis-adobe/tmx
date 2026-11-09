import { decorateIcons, getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Turns link text written in icon notation (e.g. ":linkedin:") into an icon. Edge Delivery
 * converts this notation when content is previewed; this covers content served as-is.
 * The icon name doubles as the link's accessible label.
 * @param {Element} footer
 */
function decorateIconLinks(footer) {
  footer.querySelectorAll('a').forEach((a) => {
    const match = a.textContent.trim().match(/^:([a-z0-9-]+):$/);
    if (match) {
      const icon = document.createElement('span');
      icon.className = `icon icon-${match[1]}`;
      a.replaceChildren(icon);
    }
    const iconName = a.querySelector('.icon')?.className.match(/icon-([a-z0-9-]+)/)?.[1];
    if (iconName && !a.textContent.trim()) a.setAttribute('aria-label', iconName);
  });
  decorateIcons(footer);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  if (!fragment) return;
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  decorateIconLinks(footer);

  block.append(footer);
}
