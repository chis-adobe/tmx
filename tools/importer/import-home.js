/**
 * Import script for the TMX homepage (template "home").
 *
 * Source: https://www.tmx.com/
 * Outputs three documents:
 *   /                  homepage
 *   /fragments/header  shared header (nav) fragment
 *   /fragments/footer  shared footer fragment
 */
import {
  SITE, block, buildMain, buttonLink, el, image, link, mapHref, metadata,
  sectionMetadata, text, wrap,
} from './tmx-helpers.js';

const COMPANY_GROUPS = [
  'Capital Formation',
  'Equities and Fixed Income Trading and Clearing',
  'Derivatives Trading and Clearing',
  'Global Insights',
];

const MIGRATED_ARTICLE = `${SITE}/povs/2026-tsx30-mining-sector`;

const findByText = (root, selector, value) => [...root.querySelectorAll(selector)]
  .find((n) => text(n) === value);

/* ---------- homepage ---------- */

function carousel(document) {
  const rows = [...document.querySelectorAll('.carousel-item')].map((item) => {
    const bg = document.defaultView.getComputedStyle(item).backgroundImage;
    const match = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
    const content = document.createElement('div');
    [...item.querySelector('.container').children].forEach((child) => {
      if (child.tagName === 'H1') {
        content.append(el(document, 'h2', text(child)));
      } else if (child.tagName === 'H2') {
        content.append(el(document, 'p', text(child)));
      } else if (child.querySelector('a')) {
        const a = child.querySelector('a');
        content.append(buttonLink(document, a.getAttribute('href'), text(a), 'strong'));
      } else {
        content.append(el(document, 'p', text(child)));
      }
    });
    return [match ? image(document, match[1], '') : '', content];
  });
  return block(document, 'Carousel', rows);
}

function statement(document) {
  const h2 = [...document.querySelectorAll('h2')].find((h) => text(h).startsWith('We make markets'));
  const accent = h2.querySelector('span');
  const lead = [...h2.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')
    .replace(/\.\s*$/, '')
    .trim();
  const h1 = document.createElement('h1');
  h1.append(`${lead} `, el(document, 'strong', `${text(accent)}.`));
  const p = h2.closest('div').querySelector('p') || h2.parentElement.parentElement.querySelector('p');
  const accentImg = document.querySelector('img[src*="sustainability-accents"]');
  return [
    h1,
    el(document, 'p', text(p)),
    accentImg ? wrap(document, 'p', image(document, accentImg.getAttribute('src'), '')) : null,
    sectionMetadata(document, 'statement'),
  ];
}

function companies(document) {
  const rows = COMPANY_GROUPS.map((name) => {
    const heading = findByText(document, 'h2', name);
    const body = heading.closest('.home-text');
    const [description, links] = body.querySelectorAll(':scope > p');
    const img = document.querySelector(`img[alt="${name}"]`);
    const content = document.createElement('div');
    content.append(el(document, 'h3', name), el(document, 'p', text(description)));
    const linksP = document.createElement('p');
    [...links.querySelectorAll('a')].forEach((a, i) => {
      if (i > 0) linksP.append(' ');
      linksP.append(link(document, a.getAttribute('href'), text(a)));
    });
    content.append(linksP);
    return [image(document, img.getAttribute('src'), name), content];
  });
  return [
    el(document, 'h2', 'Our Companies'),
    block(document, 'Cards (teaser)', rows),
    sectionMetadata(document, 'light, chevron-heading'),
  ];
}

function newsAndInsights(document) {
  // only the migrated article is referenced; its card is rendered from the article page itself
  const viewAll = findByText(document, 'a', 'View All POVS');
  const articles = document.createElement('div');
  articles.append(wrap(document, 'p', el(document, 'a', MIGRATED_ARTICLE, { href: MIGRATED_ARTICLE })));
  return [
    el(document, 'h2', 'News and Insights'),
    el(document, 'h3', 'POVs'),
    block(document, 'News and Insights', [[articles]]),
    buttonLink(document, viewAll.getAttribute('href'), text(viewAll)),
    sectionMetadata(document, 'chevron-heading, split-main'),
  ];
}

function pressReleases(document) {
  const heading = findByText(document, 'h3', 'Press Releases');
  const column = heading.parentElement;
  const nodes = [el(document, 'h3', 'Press Releases')];
  column.querySelectorAll('h4').forEach((h4) => {
    const a = h4.querySelector('a');
    const date = h4.previousElementSibling;
    if (date) nodes.push(el(document, 'p', text(date)));
    nodes.push(wrap(document, 'h4', link(document, a.getAttribute('href'), text(a))));
  });
  const viewAll = findByText(document, 'a', 'View All Press Releases');
  nodes.push(buttonLink(document, viewAll.getAttribute('href'), text(viewAll)));
  nodes.push(sectionMetadata(document, 'split-aside'));
  return nodes;
}

function investorRelations(document) {
  const tsx = findByText(document, 'h3', 'TSX:X');
  const left = document.createElement('div');
  const learnMore = tsx.parentElement.querySelector('a');
  left.append(
    el(document, 'h3', 'TSX:X'),
    el(document, 'p', text(tsx.parentElement.querySelector('p'))),
    buttonLink(document, learnMore.getAttribute('href'), text(learnMore)),
  );
  const results = findByText(document, 'h3', 'Latest Quarterly Results');
  const right = document.createElement('div');
  const ul = document.createElement('ul');
  results.parentElement.querySelectorAll('a.q-card').forEach((a) => {
    const img = a.querySelector('img');
    const item = link(document, a.getAttribute('href'), '');
    item.append(image(document, img.getAttribute('src'), ''), ` ${text(a)}`);
    ul.append(wrap(document, 'li', item));
  });
  right.append(el(document, 'h3', 'Latest Quarterly Results'), ul);
  return [
    el(document, 'h2', 'Investor Relations'),
    block(document, 'Columns', [[left, right]]),
    sectionMetadata(document, 'light, chevron-heading'),
  ];
}

/* ---------- header fragment ---------- */

function navTree(document) {
  const ul = document.createElement('ul');
  const source = document.querySelector('.main_nav ul.wrapper');
  [...source.children].filter((li) => li.tagName === 'LI').forEach((li) => {
    const label = text(li.querySelector(':scope > a, :scope > span'));
    const item = document.createElement('li');
    const topLink = li.querySelector(':scope > a');
    const columns = li.querySelector('ul');
    if (!columns) {
      // "Home" has no link on the homepage itself; it always points to the site root
      item.append(link(document, topLink ? topLink.getAttribute('href') : '/en', label));
      ul.append(item);
      return;
    }
    item.append(label);
    const sub = document.createElement('ul');
    [...columns.children].forEach((col) => {
      const colLink = col.querySelector(':scope > div > a');
      const colItem = wrap(document, 'li', link(document, colLink.getAttribute('href'), text(colLink)));
      const links = col.querySelector(':scope > ul');
      if (links) {
        const third = document.createElement('ul');
        links.querySelectorAll(':scope > li > a').forEach((a) => {
          third.append(wrap(document, 'li', link(document, a.getAttribute('href'), text(a))));
        });
        colItem.append(third);
      }
      sub.append(colItem);
    });
    const contact = columns.parentElement.querySelector(':scope > div > a');
    if (contact) sub.append(wrap(document, 'li', link(document, contact.getAttribute('href'), text(contact))));
    item.append(sub);
    ul.append(item);
  });
  return ul;
}

function headerFragment(document) {
  const logo = document.querySelector('#page-header a[href="/en"] img') || document.querySelector('a[href="/en"] img');
  const brand = link(document, '/en', '');
  brand.append(image(document, logo.getAttribute('src'), 'TMX'));

  const utility = document.createElement('ul');
  utility.append(
    wrap(document, 'li', link(document, 'https://money.tmx.com/en/quote/X', 'TMX (X)')),
    wrap(document, 'li', link(document, '/en/search', 'Site Search')),
    wrap(document, 'li', link(document, '/fr', 'Français')),
  );

  const searchInput = document.querySelector('input[placeholder="Search for a symbol..."]');
  const powered = document.createElement('p');
  powered.append('Powered by ', link(document, 'https://money.tmx.com/en/', 'TMX Money'));

  return buildMain(document, [
    [wrap(document, 'p', brand)],
    [navTree(document)],
    [utility],
    [el(document, 'p', searchInput?.getAttribute('placeholder') || 'Search for a symbol...'), powered],
  ]);
}

/* ---------- footer fragment ---------- */

function footerFragment(document) {
  const footer = document.querySelector('#page-footer');
  const pillars = [...footer.querySelectorAll('.pillar')].map((pillar) => {
    const cell = document.createElement('div');
    const list = document.createElement('ul');
    pillar.querySelectorAll('ul > li > a').forEach((a) => {
      list.append(wrap(document, 'li', link(document, a.getAttribute('href'), text(a))));
    });
    cell.append(wrap(document, 'p', el(document, 'strong', text(pillar.querySelector('.caption')))), list);
    return cell;
  });

  const logo = footer.querySelector('.logo img');
  const brand = link(document, '/en', '');
  brand.append(image(document, logo.getAttribute('src'), 'TMX'));

  const legal = document.createElement('ul');
  footer.querySelectorAll('.footer_links ul.navigation > li > a').forEach((a) => {
    legal.append(wrap(document, 'li', link(document, a.getAttribute('href'), text(a))));
  });

  const social = document.createElement('ul');
  [['//x.com', 'x'], ['facebook.com', 'facebook'], ['linkedin.com', 'linkedin'], ['youtube.com', 'youtube']]
    .forEach(([host, icon]) => {
      const a = footer.querySelector(`a[href*="${host}"]`);
      if (!a) return;
      // :name: is the document notation for an icon from /icons
      const item = el(document, 'a', `:${icon}:`, { href: mapHref(a.getAttribute('href')) });
      social.append(wrap(document, 'li', item));
    });

  const disclaimer = [...footer.querySelectorAll('p')].find((p) => text(p).startsWith('TMX Group Limited and its affiliates'));
  const copyright = [...footer.querySelectorAll('*')].find((n) => n.children.length === 0 && text(n).startsWith('Copyright'));

  return buildMain(document, [
    [block(document, 'Columns', [pillars])],
    [wrap(document, 'p', brand), legal, social],
    [el(document, 'p', text(disclaimer)), el(document, 'p', text(copyright))],
  ]);
}

export default {
  transform: ({ document }) => {
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const main = buildMain(document, [
      [carousel(document)],
      statement(document),
      companies(document),
      newsAndInsights(document),
      pressReleases(document),
      [
        ...investorRelations(document),
        metadata(document, {
          Title: 'TMX Group of Companies',
          Description: description,
          Template: 'home',
        }),
      ],
    ]);

    return [
      { element: main, path: '/index' },
      { element: headerFragment(document), path: '/fragments/header' },
      { element: footerFragment(document), path: '/fragments/footer' },
    ];
  },
};
