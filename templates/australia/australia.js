/**
 * Australia template (TMX Australia Exchange pages, under /australia/).
 * Pages in /australia/ get this template from the /metadata sheet, so authors don't set it.
 * `metadata` holds the defaults applied to every page on this template (page metadata wins):
 * the Australia header and footer fragments. Layout and design live in australia.css.
 */
export const metadata = {
  nav: '/fragments/australia/header',
  footer: '/fragments/australia/footer',
};

export default function decorate() {
  // no template-level DOM changes; the design lives in australia.css
}
