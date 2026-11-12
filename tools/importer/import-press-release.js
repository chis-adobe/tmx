/**
 * Import script for TMX press releases (template "press-release").
 *
 * Sources and outputs:
 *   https://www.tmx.com/en/newsroom/press-releases?id=NNNN -> /newsroom/press-releases/<slug>
 *     + /authors/<contact>              (media contact, when the release names one)
 *     + /disclaimers/press-release      ("About TMX Group" boilerplate, shared by every release)
 *
 * Page shape: an Article block (Title, Description, Date, City, Related Document, Contact) then the
 * release text as free text, then the disclaimer fragment. The press-release template puts the
 * dateline, related document and contact back around the text (scripts/article-layout.js).
 */
import {
  AUTHORS, DISCLAIMERS, articleBlock, authorBlock, block, buildMain, cloneContent, el, link,
  metadata, migratedPath, siteLink, text, wrap,
} from './tmx-helpers.js';

/** "November 10, 2026 (TORONTO) – " at the start of the first paragraph. */
const DATELINE = /^\s*([A-Z][a-z]+\.? \d{1,2}, \d{4})\s*\(([^)]+)\)\s*[–—-]\s*/;

const isEmpty = (n) => !text(n) && !n.querySelector('img, a'); // text() also trims &nbsp;
const titleCase = (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/** Removes the dateline prefix from the paragraph's leading text and returns [date, city]. */
function stripDateline(p) {
  const match = text(p).match(DATELINE);
  if (!match) return [];
  let remaining = match[0].replace(/\s+/g, ' ').trimStart().length;
  const walker = p.ownerDocument.createTreeWalker(p, 4 /* NodeFilter.SHOW_TEXT */);
  while (remaining > 0 && walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.textContent.replace(/\s+/g, ' ').replace(/^\s+/, '');
    const cut = Math.min(remaining, value.length);
    node.textContent = value.slice(cut);
    remaining -= cut;
  }
  return [match[1], match[2]];
}

/** "Catherine Kee<br>Head of Media Relations<br>TMX Group<br>416-…<br><a>email</a>" */
function contactDetails(document, p) {
  const lines = [];
  let current = [];
  [...p.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') {
      lines.push(current);
      current = [];
    } else current.push(node);
  });
  lines.push(current);
  const values = lines.map((nodes) => ({ nodes, value: nodes.map((n) => n.textContent).join('').trim() }))
    .filter((l) => l.value);
  const email = values.find((l) => /@/.test(l.value));
  const phone = values.find((l) => /^[+\d][\d\s().-]{6,}$/.test(l.value));
  const rest = values.filter((l) => l !== email && l !== phone);
  const [name, ...roleLines] = rest;

  const role = document.createElement('p');
  roleLines.forEach((l, i) => {
    if (i) role.append(document.createElement('br'));
    role.append(l.value);
  });
  return {
    name: name?.value || '',
    Role: role,
    Phone: phone?.value || '',
    Email: email?.value || '',
  };
}

export default {
  transform: ({ document, url, params }) => {
    const pageUrl = new URL(params?.originalURL || url);
    const id = pageUrl.searchParams.get('id');
    const title = text(document.querySelector('h1'));
    const date = text(document.querySelector('.news_single .publish_date'));
    const wrapper = document.querySelector('.news_single .content_wrapper');
    const children = [...wrapper.children];

    // description: a paragraph that is only bold-italic text, before the dateline paragraph
    const datelineIndex = children.findIndex((c) => c.tagName === 'P' && DATELINE.test(text(c)));
    const descriptionEl = children.slice(0, Math.max(datelineIndex, 0))
      .find((c) => c.tagName === 'P' && c.querySelector('strong') && text(c) === text(c.querySelector('strong')));

    const relatedEl = children.find((c) => c.querySelector('a.pdf'));
    const aboutIndex = children.findIndex((c) => /^H[1-6]$/.test(c.tagName) && /^About TMX Group/.test(text(c)));
    const contactIndex = children.findIndex((c) => /^For more information/i.test(text(c)));
    const endIndex = [children.indexOf(relatedEl), aboutIndex, contactIndex]
      .filter((i) => i >= 0)
      .reduce((a, b) => Math.min(a, b), children.length);

    // release text: everything between the description and the related document / boilerplate
    const bodyNodes = children.slice(0, endIndex)
      .filter((c) => c !== descriptionEl && !isEmpty(c))
      .map((c) => cloneContent(document, c));
    const firstParagraph = bodyNodes.find((n) => n.tagName === 'P');
    const [, cityRaw] = firstParagraph ? stripDateline(firstParagraph) : [];
    const city = cityRaw ? titleCase(cityRaw) : '';

    const relatedLink = relatedEl?.querySelector('a.pdf');
    const relatedDocument = relatedLink
      ? wrap(document, 'p', link(document, relatedLink.getAttribute('href'), text(relatedLink)))
      : '';

    // media contact -> shared author page
    const outputs = [];
    let contact = '';
    if (contactIndex >= 0 && children[contactIndex + 1]) {
      const details = contactDetails(document, children[contactIndex + 1]);
      if (details.name) {
        const authorPath = AUTHORS[details.name] || `/authors/${slugify(details.name)}`;
        contact = siteLink(document, authorPath);
        outputs.push({
          path: authorPath,
          element: buildMain(document, [[
            authorBlock(document, {
              Name: details.name,
              Role: details.Role,
              Phone: details.Phone,
              Email: details.Email,
            }),
            metadata(document, { Title: details.name, Robots: 'noindex', Template: 'pov' }),
          ]]),
        });
      }
    }

    // "About TMX Group" boilerplate -> shared disclaimer fragment
    if (aboutIndex >= 0) {
      const aboutEnd = contactIndex > aboutIndex ? contactIndex : children.length;
      const about = children.slice(aboutIndex + 1, aboutEnd).filter((c) => !isEmpty(c));
      outputs.push({
        path: DISCLAIMERS.pressRelease,
        element: buildMain(document, [[
          el(document, 'h2', 'About TMX Group (TSX-X)'),
          ...about.map((c) => cloneContent(document, c)),
          metadata(document, { Title: 'Press release disclaimer', Robots: 'noindex' }),
        ]]),
      });
    }

    const description = descriptionEl ? text(descriptionEl) : '';
    const main = buildMain(document, [
      [
        articleBlock(document, {
          Title: title,
          Description: description,
          Date: date,
          City: city,
          Contact: contact,
          'Related Document': relatedDocument,
        }),
        ...bodyNodes,
      ],
      [
        block(document, 'Fragment', [[siteLink(document, DISCLAIMERS.pressRelease)]]),
        metadata(document, {
          Title: title,
          Description: firstParagraph ? text(firstParagraph) : description,
          Template: 'press-release',
          Breadcrumbs: 'true',
        }),
      ],
    ]);

    const path = migratedPath(`/en/newsroom/press-releases?id=${id}`)
      || `/newsroom/press-releases/${slugify(title)}`;
    return [{ element: main, path }, ...outputs];
  },
};
