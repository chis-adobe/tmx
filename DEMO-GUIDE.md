# TMX on AEM Edge Delivery Services — Demo guide

Everything built for the TMX site, with what to show for each feature and where to show it.
Status checked on 16 November 2026.

## Where things are

| What | URL |
|------|-----|
| Preview site (show everything here) | https://main--tmx--chis-adobe.aem.page/ |
| Live site | https://main--tmx--chis-adobe.aem.live/ |
| Document Authoring (DA) | https://da.live/#/chis-adobe/tmx |
| Site configuration (library tab) | https://da.live/config#/chis-adobe/tmx/ |
| Edit a page in DA | `https://da.live/edit#/chis-adobe/tmx/<path>` e.g. `.../povs/2026-tsx30-mining-sector` |
| Code | https://github.com/chis-adobe/tmx |

## Before the demo — checklist

**Run the demo on the preview site.** Several English pages are previewed but not published live:

| Page | Preview | Live |
|------|:-------:|:----:|
| Home `/` | yes | **no** |
| POV landing + search `/povs/` | yes | **no** |
| 3 POVs `/povs/…` | yes | yes |
| 3 press releases `/newsroom/press-releases/…` | yes | **no** |
| Authors `/authors/…`, disclaimers `/disclaimers/…` | yes | yes |
| French pages `/fr/…` (all 8) | yes | yes |
| Block & template library `/docs/library/…` | yes | yes |
| Placeholders sheet `/placeholders.json` | yes | yes |
| Bulk metadata sheet `/metadata.json` (noindex for authors) | yes | **no** |
| POV query index `/povs/query-index.json` | yes | yes |

To-do before showing the live site:

- [ ] Publish the English home page, the POV landing page and the 3 press releases live. Until
      then, French "View all" links and the English language link on `/fr/` go to a 404 on the live site.
- [ ] Publish `/metadata.json` live (authors are `noindex` only on preview).
- [ ] Optional: add **POV Cards** and **POV Search** to the block library. Both blocks exist,
      but they have no example docs and aren't listed in the Blocks sheet.
- [ ] Use a fresh browser profile or incognito window for the language demo. A remembered
      language choice overrides the browser language.

## Suggested demo flow (about 30 minutes)

1. **Home page**: the migrated design, with News and Insights cards built from the POVs (§1).
2. **A POV article**: the headline and text authored once, with byline, author card and disclaimer added automatically (§2).
3. **The DA document behind it**: plain text plus one Metadata table, nothing else to maintain (§2, §10).
4. **Tags**: click a tag, land on the POV search, filter and search (§3, §4).
5. **A press release**: dateline, PDF and media contact placed by the template (§5).
6. **Shared content**: edit a disclaimer or an author once, see it update everywhere (§6, §7).
7. **French**: switch language in the header, then show the automatic redirect with `?locale=fr` (§8).
8. **Authoring**: the block & template library in DA, with clean previews and a template
   inserting a ready-to-fill press release (§9, §10).
9. Optional for technical audiences: the import scripts and how the code is organized (§11, §12).

---

## 1. Home page

https://main--tmx--chis-adobe.aem.page/

- Migrated from tmx.com, with images served from **AEM Assets** (publish-p130746…/content/dam/tmx/…).
- **Carousel** of four banners (Cboe Australia, CDR Options, TSX CDR Centre, modernization).
- **Statement** section ("We make markets better and empower bold ideas") with the accent graphic.
- **Our Companies**: teaser cards (`Cards (teaser)`), each with an image, description and a row of company links.
- **News and Insights**: the POV cards are *not* authored by hand. The author only lists links
  to the three POVs, and each card's image, title, tags, date, author and summary comes from that POV's
  own page metadata (or the POV query index). Edit a POV's description and the card updates.
- **Press Releases**: the three latest releases link to the migrated pages on this site.
- **Investor Relations**: TSX:X intro and the quarterly-results tiles (icon + label links).
- The **home** template adds the shared header and footer automatically. Authors don't wire them on each page.

## 2. POV articles

- https://main--tmx--chis-adobe.aem.page/povs/2026-tsx30-mining-sector (Dean McPherson)
- https://main--tmx--chis-adobe.aem.page/povs/2026-where-canada-is-winning (Richard Goodman)
- https://main--tmx--chis-adobe.aem.page/povs/2026-scaling-the-tsx30 (Robert Peterman)

What to show:

- **Authoring is just text.** In DA, a POV is the headline, then the article, then one
  **Metadata** table: Description, Date, Tags, Image, Author, Template (`pov`), Breadcrumbs.
  The headline is written once (no separate Title).
- The **pov** template builds the page around it:
  - "date | tags" byline under the headline; each tag links to the POV search (§3)
  - the **author card** after the article (from the author's page, §6)
  - breadcrumbs, header and footer
- **Footnotes** stay with the article (small "legal" style). The **copyright disclaimer** is the
  shared `/disclaimers/pov` fragment (§7).
- **Data tables** from the source (Scaling the TSX30: Company / Market Focus / Market Cap…)
  become a proper **Table** block.
- **Image** and **Description** double as the social-sharing image/description *and* the card
  image/summary everywhere POVs are listed.

## 3. POV landing page and search

https://main--tmx--chis-adobe.aem.page/povs/

- **POV Cards** block: the author lists POV links. The first becomes the large featured card, and
  up to four more become small cards beside it. The layout always holds, and extra links are ignored.
- **POV Search** block: keyword search, a category dropdown, Filter / Reset, and **Load More**
  (6 per page), with results newest first.
  - All labels (placeholder, buttons, "no results" message) are authored in the block, not hard-coded.
  - The search state is in the URL and can be shared:
    - https://main--tmx--chis-adobe.aem.page/povs/?category=mining
    - https://main--tmx--chis-adobe.aem.page/povs/?q=gold
- Clicking a **tag** on a POV card or byline opens this page with that category preselected.
- Data comes from the **POV query index** (`/povs/query-index.json`: path, title, description,
  image, date, tags, author). Pages that are only previewed fall back to their own page metadata.

## 4. Tag taxonomy

- Approved tags live in **one place**: the `options` sheet of the block library
  (`/docs/library/blocks.json`), as `Label=key` pairs:
  - `tags`: all approved tags. DA uses this row to **autocomplete Tags fields**.
  - `categories`: which tags appear in the POV Search category list.
  - `tags-fr`: French labels for the same keys (e.g. *Clean Technology* → *Technologies propres*).
- Content stores only **keys** (`tsx30, mining`). The site adds the TMX "#" and the right
  language's label when it displays them. Renaming a label happens once, in the sheet.

## 5. Press releases

- https://main--tmx--chis-adobe.aem.page/newsroom/press-releases/tmx-group-equity-financing-statistics-october-2026
- https://main--tmx--chis-adobe.aem.page/newsroom/press-releases/tmx-group-consolidated-trading-statistics-october-2026
- https://main--tmx--chis-adobe.aem.page/newsroom/press-releases/tmx-group-limited-declares-dividend-of-0-26-per-common-share

What to show:

- Same idea as POVs: headline + release text + one **Metadata** table with
  Description, **Blurb**, Date, City, Tags, **Contact**, **Related Document**,
  Related Document Title, Template (`press-release`), Breadcrumbs.
  The Blurb is a metadata field on purpose, so authors don't forget it.
- The **press-release** template places everything:
  - **Date** under the headline, then the **Blurb** in bold italic (e.g. the marketplaces covered)
  - **Dateline**: "November 10, 2026 (TORONTO) –" is added to the start of the first paragraph.
    Authors never type it, and the date is entered once.
  - **Related Document**: the PDF link right after the text, labelled "Related Document:". Its link
    text defaults to the headline.
  - **About TMX Group (TSX-X)**: the shared `/disclaimers/press-release` fragment
  - **Contact** at the very bottom: "For more information please contact:" + Catherine Kee's card
- The dividend release has **no contact and no blurb**, and the template simply leaves them out.
- The labels ("Related Document:", "For more information please contact:") come from the
  **placeholders sheet** (`/placeholders.json`), not code. Change the wording or translate it there.

## 6. Authors and media contacts

- https://main--tmx--chis-adobe.aem.page/authors/dean-mcpherson (also richard-goodman, robert-peterman)
- https://main--tmx--chis-adobe.aem.page/authors/catherine-kee (media contact, no photo)

What to show:

- Each person is **one page with one Author table** (Photo, Name, Role, Phone, Email, Link).
  The name is entered once.
- The same page is reused everywhere: as the author card on POVs, as the contact on press releases,
  and for the author name on News and Insights cards. **Edit Catherine's phone number once** and
  every press release updates.
- Phone and email become click-to-call / mailto links. Without a photo, the card switches to a
  single column.
- Author pages are kept out of search engines (`noindex`) by the site-wide **metadata sheet**
  (`/metadata.json`, rule `/authors/**`), so there's nothing to remember per page.

## 7. Shared disclaimers

- https://main--tmx--chis-adobe.aem.page/disclaimers/pov (copyright notice on every POV)
- https://main--tmx--chis-adobe.aem.page/disclaimers/press-release ("About TMX Group" on every release)

Each is included with a **Fragment** block. Legal updates the text once and every article
changes. Fragments are sanitized before they're inserted.

## 8. French site and automatic language redirect

- https://main--tmx--chis-adobe.aem.page/fr/ (home), `/fr/povs/2026-tsx30-mining-sector`,
  `/fr/povs/2026-where-canada-is-winning`, French author pages, French disclaimer, French header
  and footer. All are **live** too.
- French pages **mirror the English paths** (`/povs/x` ↔ `/fr/povs/x`).
- French pages get `lang="fr"`, and the template automatically uses the **French header and footer**
  (`/fr/fragments/...`).
- The header's **language link** points to the same page in the other language (or that language's
  home when there is no translation) and **remembers** the visitor's choice.
- **Automatic redirect**: a visitor whose browser is set to French and lands on an English page goes
  to its French version, **only if one exists**. Scaling the TSX30 has no French version, so it stays
  in English. A remembered choice always wins. Editors, previews in frames and library pages never redirect.
- **Testing without changing browser settings**: add `?locale=fr` (or `?locale=en`) to an English page:
  - https://main--tmx--chis-adobe.aem.page/?locale=fr → `/fr/`
  - https://main--tmx--chis-adobe.aem.page/povs/2026-tsx30-mining-sector?locale=fr → French version
  - https://main--tmx--chis-adobe.aem.page/povs/2026-scaling-the-tsx30?locale=fr → stays English
- Tags show their French labels on French pages (§4).
- Note: the French pages were **translated from the English pages**, not imported from tmx.com/fr.

## 9. Block & template library in DA

- In DA, open any document → **Library** panel: **Blocks**, **Templates** and **Icons** come from
  the site configuration's `library` tab:
  - `docs/library/blocks.json`: 20 blocks
  - `docs/library/templates.json`: Home Page, POV Article, POV Listing, Author Profile, Press Release
  - `docs/library/icons.json`
- Every block has an **example doc** with one section per variant (e.g. Cards / Cards (teaser),
  Table / striped / bordered / no header). Each comes with a **description** shown in the library,
  so authors know when to use it and how to fill it in. Search tags help authors find blocks.
- **Clean previews**: anything under `/docs/library/` renders **without the site header and footer**,
  and the library's description tables are hidden, so the preview shows just the block or template.
  - https://main--tmx--chis-adobe.aem.page/docs/library/blocks/cards
  - https://main--tmx--chis-adobe.aem.page/docs/library/templates/press-release
- **Templates insert a ready-to-fill page**, including the full **Metadata** table with every field
  (e.g. the Press Release template lists Blurb, City, Contact, Related Document…).
- The **Metadata** example doc shows the general, POV and press-release field sets side by side
  as readable tables.
- Working samples: Form (with a sample form sheet), Search (with a sample index), Modal (any link to
  a `/modals/` page opens as a popup), Embed and Video (YouTube, Vimeo, link-only auto-embed),
  and Section Metadata styles (light, highlight, chevron-heading, legal, background colour or image).

## 10. Authoring experience (worth calling out)

- **No hard-coded copy**: labels come from authored blocks, the placeholders sheet or the tag sheet.
- **Fill in a field once**: title, date and author each appear once and are reused everywhere
  (page, cards, search, social sharing).
- **Shared content is edited once**: authors, contacts, disclaimers, header and footer.
- **Universal Editor**: the page properties panel has the POV and press release fields (Date, Tags,
  Author, Blurb, City, Contact, Related Document, Related Document Title) and a Press Release template option.
- **Templates set the header and footer** and the page layout. Pages only pick a template.

## 11. Import tooling (technical audience)

Re-runnable import scripts turn tmx.com pages into DA-ready documents:

- `tools/importer/import-home.js`: the home page
- `tools/importer/import-pov.js`: POV articles + author pages + the POV disclaimer
  (finds the body and date on any POV, converts data tables, extracts the author box)
- `tools/importer/import-press-release.js`: press releases + the media contact's author page + the
  "About TMX Group" disclaimer (strips the dateline into Date/City, the PDF into Related Document)
- Source links to migrated pages are rewritten to the new site paths.
- Every import is checked against the source text. Assembled pages match the source at 99.5–100%.

## 12. Under the hood (technical audience)

- Edge Delivery Services with **Document Authoring**, no build step and no runtime dependencies.
- Templates: `templates/home`, `templates/pov`, `templates/press-release`. Shared logic lives in
  `scripts/` (`pov.js` card data, `taxonomy.js` tags, `locale.js` languages).
- Blocks added for TMX: News and Insights, POV Cards, POV Search, Author, plus the legacy POV
  Metadata and Press Release Metadata blocks (older pages that use them still render).
- Every new string the visitor sees can be changed by authors. Fragments are sanitized with DOMPurify.
  Lint (ESLint with security plugins, Stylelint) runs on every pull request.

## Known gaps — avoid in the demo

- English home, `/povs/`, press releases and `/metadata.json` are **not live** yet (see the checklist).
- **POV Cards** and **POV Search** have no block-library example docs.
- Only two POVs have French versions. Press releases have none.
- The Related Document PDFs and many outbound links still point to tmx.com.
- The POV landing page's search covers the three migrated POVs. Older POVs on the source site aren't migrated.
