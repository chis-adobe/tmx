/**
 * Press release template.
 * `metadata` holds defaults applied to every page on this template (page metadata wins).
 * The page is laid out around its Article block: city/date dateline at the start of the text,
 * the related document right after it, and the media contact at the bottom of the page;
 * see scripts/article-layout.js. The "About TMX Group" boilerplate is a /disclaimers/ fragment.
 */
import decorateArticleLayout from '../../scripts/article-layout.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

export default function decorate(main) {
  decorateArticleLayout(main);
}
