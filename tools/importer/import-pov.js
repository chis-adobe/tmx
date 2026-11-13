/**
 * Import script for TMX POV pages (template "pov").
 *
 * Sources and outputs:
 *   https://www.tmx.com/en/pov?id=NNN -> /povs/<slug> (article, see MIGRATED in tmx-helpers.js)
 *                                       + /authors/<name> (author page: a single Author block;
 *                                         robots noindex comes from the /metadata sheet)
 *                                       + /disclaimers/pov (shared POV disclaimer fragment)
 *   https://www.tmx.com/en/pov        -> /povs/ (article listing)
 */
import {
  ARTICLE_TEASERS, AUTHORS, DISCLAIMERS, SITE, authorBlock, block, buildMain, cloneContent, el,
  image, link, metadata, migratedPath, povMetadataBlock, sectionMetadata, siteLink, slugify, text, wrap,
} from './tmx-helpers.js';

const articlePath = (id) => migratedPath(`/en/pov?id=${id}`);

/**
 * A data table in the article becomes a Table block (header row first). Without this the
 * importer would read the table's first header cell (e.g. "Company") as a block name.
 */
function tableBlock(document, table) {
  const rows = [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((cell) => {
    const div = document.createElement('div');
    div.append(...[...cloneContent(document, cell).childNodes]);
    return div;
  }));
  return block(document, 'Table', rows);
}

/** Clones a body node; a table (or a wrapper that only holds a table) becomes a Table block. */
function withTableBlocks(document, node) {
  if (node.tagName === 'TABLE') return tableBlock(document, node);
  const tables = node.querySelectorAll ? [...node.querySelectorAll('table')] : [];
  if (tables.length === 1 && text(node) === text(tables[0])) return tableBlock(document, tables[0]);
  return cloneContent(document, node);
}

/* ---------- article + author fragment ---------- */

function authorFragment(document, authorBox) {
  const [photoCol, textCol] = authorBox;
  const img = photoCol.querySelector('img');
  const nameLink = textCol.querySelector('h3 a');
  const name = text(nameLink);
  const profile = nameLink.getAttribute('href');

  // title = the text between the name and "Follow ... on", keeping its inline links and line
  // breaks; formatting wrappers (e.g. <strong>) are unwrapped
  const title = document.createElement('p');
  const appendRole = (n) => {
    if (n.nodeType === 3) {
      const value = n.textContent.replace(/\s+/g, ' ');
      if (value.trim()) title.append(title.childNodes.length && title.lastChild.tagName !== 'BR' ? value : value.trimStart());
    } else if (n.tagName === 'BR') {
      if (title.childNodes.length && title.lastChild.tagName !== 'BR') title.append(document.createElement('br'));
    } else if (n.tagName === 'A') {
      title.append(cloneContent(document, n));
    } else if (n.nodeType === 1) {
      [...n.childNodes].forEach(appendRole);
    }
  };
  let node = textCol.querySelector('h3').nextSibling;
  while (node && !(node.nodeType === 3 && /Follow\s/.test(node.textContent))) {
    appendRole(node);
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
    ]]),
  };
}

function article(document, id, url) {
  const h1 = document.querySelector('h1');
  const title = text(h1);
  const date = text(document.querySelector('.article-metadata .article-date')).replace(/\s*\|.*$/, '');

  const body = document.querySelector('.article-area');
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
  const authorPath = AUTHORS[author.name] || `/authors/${slugify(author.name)}`;

  // the closing copyright/disclaimer is shared by every POV: it lives in /disclaimers/pov;
  // footnotes stay with the article
  const isDisclaimer = (n) => text(n).startsWith('Copyright');
  const footnotes = notes.filter((n) => !isDisclaimer(n));
  const disclaimer = notes.filter(isDisclaimer);

  const main = buildMain(document, [
    [
      povMetadataBlock(document, {
        Title: title,
        Date: date,
        Tags: teaser.tags,
        Image: teaser.image ? image(document, teaser.image, title) : '',
        Summary: summary,
        Author: siteLink(document, authorPath),
      }),
      ...intro.map((n) => withTableBlocks(document, n)),
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
    { element: main, path: articlePath(id) || new URL(url).pathname },
    { element: author.main, path: authorPath },
    { element: disclaimerMain, path: DISCLAIMERS.pov },
  ];
}

/* ---------- listing ---------- */

/** Featured POVs on tmx.com/en/pov (first = large card), kept only when migrated. */
const FEATURED_IDS = [171, 170, 169, 168, 167];

/** POV Search block labels and categories, as shown on tmx.com/en/pov. */
const SEARCH_ROWS = [
  ['Placeholder', 'Browse Articles, Events & Multimedia'],
  ['Search', 'Search'],
  ['Category', 'Choose a Category'],
  ['Categories', 'clean-technology, energy, life-sciences, mining, utilities-pipelines'],
  ['Filter', 'Filter'],
  ['Reset', 'Reset'],
  ['Load More', 'Load More'],
  ['No Results', 'No POVs match your search.'],
  ['Page Size', '6'],
];

function listing(document) {
  // POV Cards: links to the migrated featured POVs; the block loads each card's data
  const featured = document.createElement('div');
  FEATURED_IDS.map((id) => articlePath(id)).filter(Boolean).forEach((path) => {
    const href = `${SITE}${path}`;
    featured.append(wrap(document, 'p', el(document, 'a', href, { href })));
  });

  const disclaimer = [...document.querySelectorAll('*')]
    .find((n) => n.children.length === 0 && text(n).startsWith('This information is provided for information purposes only'));

  const main = buildMain(document, [
    [
      el(document, 'h1', 'TMX POV'),
      el(document, 'h2', 'Featured'),
      block(document, 'POV Cards', [[featured]]),
    ],
    [block(document, 'POV Search', SEARCH_ROWS)],
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
