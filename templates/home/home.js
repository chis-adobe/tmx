/**
 * Home template.
 * `metadata` holds defaults applied to every page on this template (page metadata wins),
 * so authors don't have to wire the shared header and footer fragments on each page.
 */
export const metadata = {
  nav: '/fragments/header',
  footer: '/fragments/footer',
};

export default function decorate() {
  // no template-level DOM changes; layout lives in home.css
}
