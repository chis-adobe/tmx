/**
 * Import script for TMX POV pages (template "pov").
 *
 * Sources and outputs:
 *   https://www.tmx.com/en/pov?id=171 -> /povs/2026-tsx30-mining-sector (article)
 *                                       + /authors/dean-mcpherson (author page)
 *                                       + /disclaimers/pov (shared POV disclaimer fragment)
 *   https://www.tmx.com/en/pov        -> /povs/ (article listing)
 */
import {
  ARTICLE_TEASERS, AUTHORS, DISCLAIMERS, SITE, articleBlock, authorBlock, block, buildMain,
  cloneContent, el, image, link, metadata, sectionMetadata, siteLink, text, wrap,
} from './tmx-helpers.js';

const ARTICLE_PATHS = { 171: '/povs/2026-tsx30-mining-sector' };

/* ---------- article + author fragment ---------- */

function authorFragment(document, authorBox) {
  const [photoCol, textCol] = authorBox;
  const img = photoCol.querySelector('img');
  const nameLink = textCol.querySelector('h3 a');
  const name = text(nameLink);
  const profile = nameLink.getAttribute('href');

  // title = the text between the name and "Follow ... on", keeping its inline link and line break
  const title = document.createElement('p');
  let node = textCol.querySelector('h3').nextSibling;
  while (node && !(node.nodeType === 3 && /Follow\s/.test(node.textContent))) {
    if (node.nodeType === 3) {
      const value = node.textContent.replace(/\s+/g, ' ');
      if (value.trim()) title.append(value.trimStart());
    } else if (node.tagName === 'BR') {
      if (title.childNodes.length && title.lastChild.tagName !== 'BR') title.append(document.createElement('br'));
    } else if (node.tagName === 'A') {
      title.append(cloneContent(document, node));
    }
    node = node.nextSibling;
  }
  while (title.lastChild && title.lastChild.tagName === 'BR') title.lastChild.remove();

  const follow = text({ textContent: node ? node.textContent : '' });
  const followLink = link(document, profile, `${follow} ${text(node?.nextElementSibling)}`.trim());

  return {
    name,
    main: buildMain(document, [[
      authorBlock(document, {
        Photo: image(document, img.getAttribute('src'), name),
        Name: name,
        Role: title,
        Link: wrap(document, 'p', followLink),
      }),
      metadata(document, { Title: name, Robots: 'noindex', Template: 'pov' }),
    ]]),
  };
}

function article(document, id, url) {
  const h1 = document.querySelector('h1');
  const title = text(h1);
  const byline = [...document.querySelectorAll('span, div')]
    .find((n) => n.children.length === 0 && /^[A-Z][a-z]+ \d{1,2}, \d{4}\s*\|/.test(text(n)));
  const date = byline ? text(byline).replace(/\s*\|.*$/, '') : '';

  const body = [...document.querySelectorAll('p')].find((p) => text(p).startsWith('Since 2019')).parentElement;
  // the end-of-article author box (photo + name/title column) separates body copy from footnotes
  const children = [...body.children];
  const photoIndex = children.findIndex((c) => c.querySelector('img[alt^="Photo of"]'));
  const nameIndex = children.findIndex((c, i) => i > photoIndex && c.querySelector('h3 a'));
  const isContent = (c) => c.tagName !== 'HR' && !(c.tagName === 'DIV' && !text(c));
  const intro = children.slice(0, photoIndex).filter(isContent);
  const authorBox = [children[photoIndex], children[nameIndex]];
  const notes = children.slice(nameIndex + 1).filter(isContent);

  const teaser = ARTICLE_TEASERS[id] || {};
  const summary = text(intro[0]);
  const author = authorFragment(document, authorBox);
  const authorPath = AUTHORS[author.name];

  // the closing copyright/disclaimer is shared by every POV: it lives in /disclaimers/pov;
  // footnotes stay with the article
  const isDisclaimer = (n) => text(n).startsWith('Copyright');
  const footnotes = notes.filter((n) => !isDisclaimer(n));
  const disclaimer = notes.filter(isDisclaimer);

  const main = buildMain(document, [
    [
      articleBlock(document, {
        Title: title,
        Date: date,
        Tags: teaser.tags,
        Image: teaser.image ? image(document, teaser.image, title) : '',
        Summary: summary,
        Author: siteLink(document, authorPath),
      }),
      ...intro.map((n) => cloneContent(document, n)),
    ],
    footnotes.length ? [
      ...footnotes.map((n) => cloneContent(document, n)),
      sectionMetadata(document, 'legal'),
    ] : null,
    [
      block(document, 'Fragment', [[siteLink(document, DISCLAIMERS.pov)]]),
      metadata(document, {
        Title: title,
        Description: summary,
        Template: 'pov',
        Breadcrumbs: 'true',
      }),
    ],
  ].filter(Boolean));

  const disclaimerMain = buildMain(document, [[
    ...disclaimer.map((n) => cloneContent(document, n)),
    sectionMetadata(document, 'legal'),
    metadata(document, { Title: 'POV disclaimer', Robots: 'noindex' }),
  ]]);

  return [
    { element: main, path: ARTICLE_PATHS[id] || new URL(url).pathname },
    { element: author.main, path: authorPath },
    { element: disclaimerMain, path: DISCLAIMERS.pov },
  ];
}

/* ---------- listing ---------- */

function listing(document) {
  const rows = [...document.querySelectorAll('.blog-featured-row')].map((row) => {
    const id = row.getAttribute('data-id');
    const rowTitle = text(row.querySelector('.title'));
    const content = document.createElement('div');
    content.append(
      wrap(document, 'p', link(document, `/en/pov?id=${id}`, rowTitle)),
      el(document, 'p', text(row.querySelector('.date-sector'))),
    );
    return [image(document, row.querySelector('img').getAttribute('src'), rowTitle), content];
  });

  const featured = `${SITE}${ARTICLE_PATHS[171]}`;
  const featuredLinks = document.createElement('div');
  featuredLinks.append(wrap(document, 'p', el(document, 'a', featured, { href: featured })));

  const disclaimer = [...document.querySelectorAll('*')]
    .find((n) => n.children.length === 0 && text(n).startsWith('This information is provided for information purposes only'));

  const placeholder = [
    el(document, 'p', 'Placeholder: search, filters and Load More will be connected to the query index.'),
    el(document, 'p', `Search: ${document.querySelector('input[placeholder="Search"]')?.getAttribute('aria-label') || 'Browse Articles, Events & Multimedia'}`),
    el(document, 'p', 'Category: Clean Technology, Energy, Life Sciences, Mining, Utilities & Pipelines'),
    el(document, 'p', 'Content type: Events, Podcasts, Video, Articles'),
    el(document, 'p', 'Filter | Reset'),
    el(document, 'p', 'Load More'),
    sectionMetadata(document, 'placeholder'),
  ];

  const main = buildMain(document, [
    [
      el(document, 'h1', 'TMX POV'),
      el(document, 'h2', 'Featured'),
      block(document, 'News and Insights (featured)', [[featuredLinks]]),
      block(document, 'Cards', rows),
    ],
    placeholder,
    [
      el(document, 'p', text(disclaimer)),
      sectionMetadata(document, 'legal'),
      metadata(document, {
        Title: 'TMX POV',
        Description: 'TMX POV: perspectives and insights from TMX Group.',
        Template: 'pov',
        Breadcrumbs: 'true',
      }),
    ],
  ]);
  return [{ element: main, path: '/povs/index' }];
}

export default {
  transform: ({ document, url, params }) => {
    const pageUrl = new URL(params?.originalURL || url);
    const id = pageUrl.searchParams.get('id');
    return id ? article(document, id, pageUrl.href) : listing(document);
  },
};
