/**
 * Import script for the TMX Australia Exchange site (template "australia").
 *
 * Source and outputs:
 *   https://www.tmxaustralia.com/ -> /australia/index           (home page)
 *                                  + /fragments/australia/header (Australia header fragment)
 *                                  + /fragments/australia/footer (Australia footer fragment)
 *
 * Pages under /australia/ get the australia template from the /metadata sheet; the home page also
 * sets it explicitly. Links to Australia pages that are not migrated stay on tmxaustralia.com.
 * Decorative graphics (hero chevrons) are template CSS, and the logo and icons are site icons
 * (:tmx-australia-logo:, :au-equities: ...), so the pages carry no images of their own.
 */
import {
  SITE, block, buildMain, el, mapHref, metadata, sectionMetadata, text, wrap,
} from './tmx-helpers.js';

const AU_ORIGIN = 'https://www.tmxaustralia.com';
const AU_HOME = '/australia/';

/** Australia link: its home becomes /australia/, other site pages stay on tmxaustralia.com. */
function auHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  const url = new URL(href, AU_ORIGIN);
  if (url.hostname === 'www.tmxaustralia.com' || url.hostname === 'tmxaustralia.com') {
    if (url.pathname === '/' && !url.hash) return `${SITE}${AU_HOME}`;
    if (url.pathname === '/' && url.hash) return url.hash;
    return `${AU_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  }
  return mapHref(url.href);
}

const auLink = (document, href, label) => el(document, 'a', label, { href: auHref(href) });

/** A paragraph's inline content: text, <strong>/<em> and links (rewritten), nothing else. */
function inline(document, node) {
  const out = document.createElement('p');
  const walk = (n, target) => {
    n.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        target.append(c.textContent.replace(/\s+/g, ' '));
      } else if (c.nodeType === 1) {
        if (c.tagName === 'A') {
          target.append(auLink(document, c.getAttribute('href'), text(c)));
        } else if (c.tagName === 'STRONG' || c.tagName === 'B' || c.tagName === 'EM') {
          const s = document.createElement(c.tagName === 'EM' ? 'em' : 'strong');
          walk(c, s);
          target.append(s);
        } else if (c.tagName !== 'SVG' && c.tagName !== 'svg') {
          walk(c, target);
        }
      }
    });
  };
  walk(node, out);
  out.innerHTML = out.innerHTML.replace(/\s+/g, ' ').trim();
  return out;
}

const secondary = (document, href, label) => wrap(document, 'p', wrap(document, 'em', auLink(document, href, label)));
const primary = (document, href, label) => wrap(document, 'p', wrap(document, 'strong', auLink(document, href, label)));
const iconText = (name) => `:${name}:`;
const icon = (document, name) => el(document, 'p', iconText(name));
// icon link with a text label (visually hidden by CSS), so the link has an accessible name
const iconLink = (document, href, name, label) => auLink(document, href, `${iconText(name)} ${label}`);

/* ---------- header / footer fragments ---------- */

function headerFragment(document, html) {
  const header = document.querySelector('header');
  const brand = wrap(document, 'p', iconLink(document, '/', 'tmx-australia-logo', 'TMX Australia Exchange'));
  const desktopNav = [...header.querySelectorAll('nav')].find((n) => n.querySelector(':scope > ul'));
  const list = document.createElement('ul');
  [...desktopNav.querySelectorAll(':scope > ul > li')].forEach((li) => {
    const item = document.createElement('li');
    const top = li.querySelector(':scope > a, :scope > button, :scope > div > a, :scope > div > button');
    const label = text(top);
    const sub = li.querySelector('ul');
    if (!sub && top?.tagName === 'A') {
      item.append(wrap(document, 'p', auLink(document, top.getAttribute('href'), label)));
    } else {
      item.append(el(document, 'p', label));
      const subList = document.createElement('ul');
      // only items that are links: sub-menus opened by buttons load their content client-side
      sub?.querySelectorAll(':scope > li > a, :scope > li > div > a').forEach((a) => {
        subList.append(wrap(document, 'li', auLink(document, a.getAttribute('href'), text(a))));
      });
      if (!subList.children.length) return; // nothing to link to yet (e.g. News & Notices)
      item.append(subList);
    }
    list.append(item);
  });
  // the login link is icon-only, which the importer's cleanup drops: check the raw HTML
  const login = header.querySelector('a[href="/account/login"]') || /href="\/account\/login"/.test(html || '');
  const tools = document.createElement('ul');
  if (login) tools.append(wrap(document, 'li', iconLink(document, '/account/login', 'user', 'Log in')));
  return buildMain(document, [[brand], [list], [tools]]);
}

function footerFragment(document, html) {
  const footer = document.querySelector('footer');
  const social = document.createElement('ul');
  const names = { linkedin: 'linkedin', instagram: 'instagram', facebook: 'facebook', 'x.com': 'x' };
  // social links are icon-only, which the importer's cleanup drops: read them from the raw HTML
  const rawFooter = (html || '').slice((html || '').indexOf('<footer'));
  const hrefs = [...rawFooter.matchAll(/<a[^>]*href="([^"]+)"[^>]*>\s*<svg/g)].map((m) => m[1]);
  hrefs.forEach((href) => {
    const key = Object.keys(names).find((k) => href.includes(k));
    if (key) social.append(wrap(document, 'li', el(document, 'a', iconText(names[key]), { href })));
  });
  const brandCell = document.createElement('div');
  brandCell.append(wrap(document, 'p', iconLink(document, '/', 'tmx-australia-logo', 'TMX Australia Exchange')), social);

  const columns = [...footer.querySelectorAll('h3')].map((h3) => {
    const cell = document.createElement('div');
    cell.append(el(document, 'h3', text(h3)));
    const ul = document.createElement('ul');
    h3.parentElement.querySelectorAll('ul a').forEach((a) => ul.append(wrap(document, 'li', auLink(document, a.getAttribute('href'), text(a)))));
    cell.append(ul);
    return cell;
  });

  const legal = [...footer.querySelectorAll('p, div')]
    .filter((n) => n.children.length === 0 && /TMX Group Limited and its affiliates|Copyright ©/.test(text(n)))
    .map((n) => el(document, 'p', text(n)));

  return buildMain(document, [
    [block(document, 'Columns', [[brandCell, ...columns]])],
    legal,
  ]);
}

/* ---------- home page ---------- */

function hero(document, section) {
  const spans = [...section.querySelectorAll('h1 span')].map(text).filter(Boolean);
  const cta = section.querySelector('a');
  return [
    el(document, 'p', spans[0] || ''),
    el(document, 'h1', spans.slice(1).join(' ') || text(section.querySelector('h1'))),
    el(document, 'p', text(section.querySelector('p'))),
    cta ? secondary(document, cta.getAttribute('href'), text(cta)) : null,
    sectionMetadata(document, 'au-hero'),
  ];
}

function jumpNav(document, main) {
  const links = [...main.querySelectorAll(':scope > div a[href^="#"]')];
  const ul = document.createElement('ul');
  links.forEach((a) => ul.append(wrap(document, 'li', el(document, 'a', text(a), { href: a.getAttribute('href') }))));
  return [ul, sectionMetadata(document, 'au-jump-nav')];
}

/** Section metadata with a style and an id (the jump links target the id). */
const sectionMeta = (document, style, id) => block(document, 'Section Metadata', [
  ...(style ? [['style', style]] : []),
  ...(id ? [['id', id]] : []),
]);

function overview(document, section) {
  const h2s = [...section.querySelectorAll('h2')];
  const stats = h2s.slice(1, -1).map((h2) => {
    const card = h2.closest('.tw-rounded-md') || h2.parentElement.parentElement;
    const body = document.createElement('div');
    body.append(el(document, 'h3', text(h2)));
    const p = card.querySelector('p');
    if (p) body.append(el(document, 'p', text(p)));
    const value = [...card.querySelectorAll('span')].map(text).find((t) => /^[$\d]/.test(t));
    if (value) body.append(wrap(document, 'p', el(document, 'strong', value)));
    return [body];
  });
  const noteHeading = h2s.at(-1);
  const noteBox = noteHeading.closest('.tw-rounded-md, .tw-rounded-lg') || noteHeading.parentElement.parentElement;
  const noteBody = document.createElement('div');
  noteBody.append(el(document, 'h3', text(noteHeading)));
  noteBox.querySelectorAll('p > span').forEach((span) => noteBody.append(inline(document, span)));
  return [
    el(document, 'h2', text(h2s[0])),
    el(document, 'h3', text(section.querySelector('h3'))),
    el(document, 'p', text(section.querySelector('h3 + p, p'))),
    block(document, 'Cards (stats)', stats),
    block(document, 'Notice', [[noteBody]]),
    sectionMeta(document, '', 'overview'),
  ];
}

function resources(document, section) {
  const tabs = [...section.querySelectorAll('button[role="tab"], [role="tablist"] button')];
  const panels = [...section.querySelectorAll('[role="tabpanel"]')];
  const rows = tabs.map((tab, i) => {
    const ul = document.createElement('ul');
    (panels[i] || document.createElement('div')).querySelectorAll('a').forEach((a) => {
      ul.append(wrap(document, 'li', auLink(document, a.getAttribute('href'), text(a))));
    });
    return [text(tab), ul];
  }).filter(([, ul]) => ul.children.length); // tabs whose links load client-side are left out
  return [
    el(document, 'h2', text(section.querySelector('h2'))),
    el(document, 'p', text(section.querySelector('h2 + p, p'))),
    block(document, 'Tabs (links)', rows),
    sectionMeta(document, 'au-tint', 'resources'),
  ];
}

function activity(document, section) {
  return [
    el(document, 'h2', text(section.querySelector('h2'))),
    el(document, 'p', 'Placeholder: the live market activity widget will be connected to TMX Australia market data.'),
    sectionMeta(document, 'placeholder', 'activities'),
  ];
}

function market(document, section) {
  const iconNames = { Equities: 'au-equities', Listings: 'au-listings', Warrants: 'au-warrants' };
  const cards = [...section.querySelectorAll('h2')].slice(1).map((h2) => {
    const card = h2.closest('.tw-rounded-md') || h2.parentElement.parentElement;
    const title = text(h2);
    const body = document.createElement('div');
    body.append(icon(document, iconNames[title] || 'au-market-data'), el(document, 'h3', title));
    const p = card.querySelector('p');
    if (p) body.append(el(document, 'p', text(p)));
    const a = card.querySelector('a');
    if (a) body.append(secondary(document, a.getAttribute('href'), text(a)));
    return [body];
  });
  return [
    el(document, 'h2', text(section.querySelector('h2'))),
    block(document, 'Cards (products)', cards),
    sectionMeta(document, '', 'market'),
  ];
}

function about(document, section) {
  return [
    el(document, 'h2', text(section.querySelector('h2'))),
    ...[...section.querySelectorAll('p')].map((p) => inline(document, p)),
    sectionMeta(document, 'au-dark', 'about'),
  ];
}

function contact(document, section) {
  const h2s = [...section.querySelectorAll('h2')];
  const intro = section.querySelector('p');
  const cardHeadings = h2s.slice(1, -1);
  const cards = cardHeadings.map((h2) => {
    const card = h2.closest('.tw-rounded-md') || h2.parentElement.parentElement;
    const body = document.createElement('div');
    body.append(el(document, 'h3', text(h2)));
    const links = [...card.querySelectorAll('a')];
    if (links.length) {
      links.forEach((a) => {
        const p = wrap(document, 'p', el(document, 'a', text(a), { href: a.getAttribute('href') }));
        const note = text(a.parentElement).replace(text(a), '').trim();
        if (a.parentElement.tagName === 'SPAN' && note) p.append(` ${note}`);
        body.append(p);
      });
    } else {
      // address card: the card's text without its heading
      const address = text(card).replace(text(h2), '').replace(/\s+/g, ' ').trim();
      if (address) body.append(el(document, 'p', address));
    }
    return [body];
  });
  const expert = h2s.at(-1);
  return [
    [
      el(document, 'h2', text(h2s[0])),
      intro ? inline(document, intro) : null,
      block(document, 'Cards (contact)', cards),
      sectionMeta(document, 'au-dark', 'contact'),
    ],
    [
      el(document, 'h2', text(expert)),
      el(document, 'p', text(expert.parentElement.querySelector('p') || expert.nextElementSibling)),
      block(document, 'Form', [
        [el(document, 'a', `${SITE}/australia/forms/contact-an-expert.json`, { href: `${SITE}/australia/forms/contact-an-expert.json` })],
        [el(document, 'a', `${SITE}/australia/forms/contact-an-expert`, { href: `${SITE}/australia/forms/contact-an-expert` })],
      ]),
      sectionMeta(document, 'au-dark, au-form', ''),
    ],
  ];
}

function homePage(document) {
  const main = document.querySelector('main');
  const sections = [...main.querySelectorAll(':scope > section')];
  const find = (re) => sections.find((s) => re.test(text(s.querySelector('h2'))));
  const contactSections = contact(document, find(/^Contact Options/));
  const title = document.title.replace(/\s*\|\s*TMX\s*$/, '').trim();
  return buildMain(document, [
    hero(document, sections[0]),
    jumpNav(document, main),
    overview(document, find(/^Transforming/)),
    resources(document, find(/^Key Resources/)),
    activity(document, find(/Activity/)),
    market(document, find(/'s Market$/)),
    about(document, find(/^About/)),
    contactSections[0],
    [
      ...contactSections[1],
      metadata(document, {
        Title: title,
        Description: document.querySelector('meta[name="description"]')?.content || text(sections[0].querySelector('p')),
        Template: 'australia',
      }),
    ],
  ]);
}

export default {
  transform: ({ document, html }) => [
    { element: homePage(document), path: '/australia/index' },
    { element: headerFragment(document, html), path: '/fragments/australia/header' },
    { element: footerFragment(document, html), path: '/fragments/australia/footer' },
  ],
};
