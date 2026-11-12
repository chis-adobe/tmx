/**
 * POV (article and article listing) template.
 * `metadata` holds defaults applied to every page on this template (page metadata wins),
 * so authors don't have to wire the shared header and footer fragments on each page.
 * Article pages are laid out around their Article block (author card after the article text);
 * see scripts/article-layout.js.
 */
import decorateArticleLayout from '../../scripts/article-layout.js';

export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

export default function decorate(main) {
  decorateArticleLayout(main);
}
