# DA site setup playbook: configuration, AEM Assets, block & template library, taxonomy

Built from the TMX project (`chis-adobe/tmx`, November 2026). Give this file to a new session to
recreate the same setup for another Edge Delivery Services + Document Authoring (DA) site.

---

## 0. Instructions for the agent using this file

1. **Collect every input in §1 before writing anything.** Items marked **🔶 ASK** are project-specific:
   ask the user (use multiple-choice questions where possible, and show the TMX example as
   the default/illustration). **Never invent** tags, labels, contacts, legal text or URLs.
   Items marked **🔷 DERIVE** can be worked out from the repo or the site configuration. Show the
   result to the user and ask them to confirm.
2. Build everything **locally first** under `content/` (the local preview mirrors DA), check it in
   the local preview, then upload to DA, preview and (only if asked) publish.
3. Remote writes (DA config, DA uploads, preview, publish, unpublish, delete) need the user's explicit
   request in their message. If a safety guard blocks one, don't retry or work around it; give the
   user the exact wording to send.
4. Follow the formats in §2–§9 exactly: the DA library and the site code depend on them.
5. Finish with the checks in §11.

Placeholders used below: `{ORG}`, `{SITE}` (DA org / site), `{PREVIEW}` =
`https://main--{SITE}--{ORG}.aem.page`, `{CONTENT}` = `https://content.da.live/{ORG}/{SITE}`.

---

## 1. Inputs to collect

| # | Input | How | TMX value (example) |
|---|-------|-----|---------------------|
| 1 | DA org and site | 🔷 DERIVE from the site configuration: `contentSourceUrl` from `https://admin.hlx.page/sidekick/{org}/{site}/main/config.json` (or `content.source.url` from `https://api.aem.live/{org}/sites/{site}/config.json`). Never from fstab.yaml. | `chis-adobe` / `tmx` |
| 2 | AEM Assets (DAM) author host | 🔶 ASK: "Which AEM as a Cloud Service author holds this site's assets? (author-pXXXX-eYYYY.adobeaemcloud.com)" | `author-p130746-e1275972.adobeaemcloud.com` |
| 3 | Image delivery options | 🔶 ASK (optional): insert assets as links rather than copies (`aem.assets.image.type` = `link`)? Use Dynamic Media delivery (`aem.asset.dm.delivery` = `on`)? | TMX: neither (repository only). Sibling project mnp-ak uses both. |
| 4 | Extra library tabs | 🔶 ASK: besides Blocks, Templates and Icons, add tools to the DA library panel (e.g. *Generate Variations* `https://experience.adobe.com/aem/generate-variations`, a *Request Publish* plugin)? | Blocks, Templates, Icons |
| 5 | Blocks to document | 🔷 DERIVE from `blocks/` (skip `header`, `footer`, internal helpers such as `card`, and blocks with nothing to show, e.g. `widget` without widgets). Confirm the list and each block's variants with the user. | 20 blocks, see §5 |
| 6 | Templates (page types) | 🔷 DERIVE from `templates/` and the migrated page types. 🔶 ASK which page types authors need ready-made, and each type's **metadata fields**. | Home Page, POV Article, POV Listing, Author Profile, Press Release |
| 7 | Icons | 🔷 DERIVE from `icons/*.svg` (file names without `.svg`). | facebook, linkedin, x, youtube, search |
| 8 | **Taxonomy (tags)** | 🔶 ASK: "List the approved tags (label as shown to visitors). Which of them appear as search categories? Which languages need translated labels?" Generate keys (§4) and show them for confirmation. | 21 tags, see §4 |
| 9 | Sample content | 🔶 ASK for real copy and images to use in the example docs (or reuse migrated pages). Never use lorem ipsum when site content exists. | TMX home/POV copy and `/media` images |
| 10 | Labels (placeholders) | 🔶 ASK for the wording of labels the code shows (e.g. "Related Document:", "For more information please contact:"), per language. | §8 |
| 11 | Bulk metadata rules | 🔶 ASK which folders get site-wide metadata (e.g. `noindex` for author/fragment pages). | `/authors/**` → Robots `noindex`, Template `pov` |
| 12 | Query index | 🔶 ASK whether listings or search need an index, for which folder, and which properties. | `/povs/query-index.json` (§8) |
| 13 | Languages | 🔶 ASK which languages exist and their folder (e.g. `/fr/`). | en (root), fr (`/fr/`) |

---

## 2. Site configuration spreadsheet (DA config at the site root)

DA → site root → ⚙️ (gear), or `https://da.live/config#/{ORG}/{SITE}/`. It's a **multi-sheet**
with exactly these sheets:

### Sheet `data`: AEM Assets (DAM) integration

| key | value |
|-----|-------|
| `aem.repositoryId` | 🔶 `{AEM author host}`, e.g. `author-p130746-e1275972.adobeaemcloud.com` |
| `aem.assets.image.type` | *(optional, 🔶 ASK)* `link` |
| `aem.asset.dm.delivery` | *(optional, 🔶 ASK)* `on` |

- `aem.repositoryId` connects the DA **Assets** panel to that AEM repository, so authors can pick
  images from AEM Assets. Pages then reference the **publish** URL of the asset, e.g.
  `https://publish-p130746-e1275972.adobeaemcloud.com/content/dam/tmx/heroes/tmx-australia-launch.jpg`.
- The org-level config (`https://da.live/config#/{ORG}/`) may hold its own `aem.repositoryId`
  (TMX's org uses `delivery-p130746-e1275972…`). The site value applies to this site.
- Assets must be **approved/published** in AEM so their publish URLs resolve.

### Sheet `library`: tabs in the DA library panel

Columns: `title`, `path`, `icon`, `experience` (column widths 168/529/360/216).

| title | path | icon | experience |
|-------|------|------|------------|
| Blocks | `{CONTENT}/docs/library/blocks.json` | | |
| Templates | `{CONTENT}/docs/library/templates.json` | | |
| Icons | `{CONTENT}/docs/library/icons.json` | | |
| *(optional 🔶)* Generate Variations | `https://experience.adobe.com/aem/generate-variations` | | |

### Saving it (API)

Read first (`GET https://admin.da.live/config/{ORG}/{SITE}`) and **keep every existing sheet and
row**. Then POST the whole multi-sheet as a form *value* (a file upload returns 400):

```sh
curl -X POST -F "config=<config.json" "https://admin.da.live/config/{ORG}/{SITE}"
```

```json
{
  "data":    { "total": 1, "limit": 1, "offset": 0, "data": [ { "key": "aem.repositoryId", "value": "author-pXXXX-eYYYY.adobeaemcloud.com" } ], ":colWidths": [141, 340] },
  "library": { "total": 3, "limit": 3, "offset": 0, "data": [
      { "title": "Blocks",    "path": "https://content.da.live/{ORG}/{SITE}/docs/library/blocks.json",    "icon": "", "experience": "" },
      { "title": "Templates", "path": "https://content.da.live/{ORG}/{SITE}/docs/library/templates.json", "icon": "", "experience": "" },
      { "title": "Icons",     "path": "https://content.da.live/{ORG}/{SITE}/docs/library/icons.json",     "icon": "", "experience": "" }
    ], ":colWidths": [168, 529, 360, 216] },
  ":names": ["data", "library"], ":version": 3, ":type": "multi-sheet"
}
```

Also set the project's block library URL for the coding agent (`.migration/project.json`,
`sites.{SITE}.libraryUrl` = `{PREVIEW}/docs/library/blocks.json`) once the library is previewed.

---

## 3. Library sheets (`/docs/library/`)

### `blocks.json`: multi-sheet `data` + `options`

- Sheet **`data`**: columns `name`, `path` (widths 180/573). One row per block, in the order
  authors should see them. `path` = `{CONTENT}/docs/library/blocks/<block>` (no extension).
- Sheet **`options`**: columns `blocks`, `key`, `values` (widths 160/120/420). These are value lists
  DA offers as **autocomplete** when authors fill a block or metadata row with that `key`, and the
  site reads them for the taxonomy (§4).
  - `blocks` = which blocks the row applies to: `all`, or block names (e.g. `pov-search`, `metadata`).
  - `key` = the row key authors type (e.g. `tags`).
  - `values` = `|`-separated options, each `Label=value` (or just `value`).

```json
{
  "data":    { "total": 20, "limit": 20, "offset": 0, "data": [ { "name": "Accordion", "path": "https://content.da.live/{ORG}/{SITE}/docs/library/blocks/accordion" } ], ":colWidths": [180, 573] },
  "options": { "total": 3, "limit": 3, "offset": 0, "data": [
      { "blocks": "all",        "key": "tags",       "values": "TSX30=tsx30|POV=pov|Mining=mining" },
      { "blocks": "pov-search", "key": "categories", "values": "Mining=mining|Energy=energy" },
      { "blocks": "all",        "key": "tags-fr",    "values": "TSX30=tsx30|POV=pov|Mines=mining" }
    ], ":colWidths": [160, 120, 420] },
  ":names": ["data", "options"], ":version": 3, ":type": "multi-sheet"
}
```

### `templates.json`: single sheet

Columns `key` (template name shown to authors) and `value` (`{CONTENT}/docs/library/templates/<name>`),
widths 160/573, `":sheetname": "data", ":type": "sheet"`.

### `icons.json`: single sheet

One column `key` (the icon name = `icons/<name>.svg`), width 160. Authors insert `:name:`.

### Uploading a sheet

`POST https://admin.da.live/source/{ORG}/{SITE}/docs/library/blocks.json` with
`-F "data=@blocks.json;type=application/json"`, then preview it
(`POST https://admin.hlx.page/preview/{ORG}/{SITE}/main/docs/library/blocks.json`).

---

## 4. Taxonomy (tags) and autocomplete

**🔶 ASK the user for the tag list. Never copy TMX's tags into another project.**

Rules:

- One approved list, in the `options` sheet of `blocks.json`:
  - `tags` (blocks `all`): every approved tag as `Label=key`. This powers DA autocomplete for
    `Tags` fields and the labels the site displays.
  - `categories` (blocks = the search block, e.g. `pov-search`): the subset offered as search
    categories. 🔶 ASK which tags.
  - `tags-<locale>` (e.g. `tags-fr`, blocks `all`): same **keys**, translated **labels**. Keys not
    listed fall back to the English label. 🔶 ASK for each language.
- **Keys**: lowercase, words joined by `-`, `&` and punctuation dropped
  (`Oil & Gas` → `oil-gas`, `Closed-End Funds` → `closed-end-funds`). Keys never change once used.
- Content stores **keys only** (page metadata `Tags: tsx30, mining`), never `#` or labels. The code
  (`scripts/taxonomy.js`: `loadTaxonomy`, `tagKeys`, `tagLabel`, `formatTag(key, { hash })`) shows the
  label in the page language and adds the brand's `#` where wanted.
- In page metadata, a `Tags` row is delivered as `<meta property="article:tag">` tags; the query
  index stores them as a list.

Questions to ask (example wording):

1. "What tags should authors be able to choose from? Paste the labels exactly as visitors see them."
2. "Which of these should appear as categories in the search filter?"
3. "Which languages need translated tag labels? Please give the translation for each tag."
4. "Should tags show with a `#` (like TMX's `#Mining`)?"

TMX example (for illustration only):
`TSX30=tsx30|POV=pov|Clean Technology=clean-technology|Closed-End Funds=closed-end-funds|Communications & Media=communications-media|Consumer Products & Services=consumer-products-services|Diversified Industries=diversified-industries|Energy=energy|ETF=etf|Financial Services=financial-services|Industrial Products & Services=industrial-products-services|International=international|Israel=israel|Latin America=latin-america|Life Sciences=life-sciences|Mining=mining|Oil & Gas=oil-gas|Real Estate=real-estate|Technology=technology|United States=united-states|Utilities & Pipelines=utilities-pipelines`
(`categories` = the same list; `tags-fr` = the same keys with French labels, e.g. `Mines=mining`).

---

## 5. Library folder structure and block example docs

```
/docs/library/
  blocks.json                 data + options sheets (§3, §4)
  templates.json
  icons.json
  blocks/
    <block>                   one example doc per block (one section per variant)
    modals/sample-disclaimer  popup content for the Modal example
    sample-form.json          form definition for the Form example
    sample-search-data/
      query-index.json        small index for the Search example
  templates/
    <template>                one ready-to-fill page per template
```

Locally the same tree lives under `content/docs/library/` (`<doc>.plain.html`, sheets as `.json`).

### Variant format (exactly this; the DA library depends on it)

Each variant is **one section** (`<div>`) containing, in this order:

```html
<div>
  <h2>Cards (teaser)</h2>                       <!-- variant name shown in the library -->
  <div class="cards teaser"> …block rows… </div> <!-- the block, real sample content -->
  <div class="library-metadata">                 <!-- right AFTER the block -->
    <div><div>description</div><div>What it's for and how to fill it in (rows/cells).</div></div>
    <div><div>searchtags</div><div>teaser, companies, tiles</div></div>
  </div>
</div>
```

- The library takes the variant **name from the heading directly before the block** (otherwise from
  the class names) and the **description / searchtags from the `library-metadata` table directly
  after it**.
- **Default content** (e.g. a bare link that becomes a modal or video) is wrapped in group markers.
  The library inserts everything between them:

```html
<div>
  <h2>Modal</h2>
  <div class="library-container-start"><div><div></div></div></div>
  <p><a href="/docs/library/blocks/modals/sample-disclaimer">Read the disclaimer</a></p>
  <div class="library-container-end"><div><div></div></div></div>
  <div class="library-metadata"><div><div>description</div><div>Links to a /modals/ page open in a popup.</div></div></div>
</div>
```

- **Section Metadata** examples: `<h2>Section: light</h2>` + `section-metadata` table + `library-metadata`
  + sample text, one section per style.
- **Metadata** example doc: one section per field set (general / per page type). Only the first
  Metadata table becomes page metadata (see the optional code in §7).
- Descriptions: say what the block is for, its rows/cells, and its variants. Write for authors.
- Use **real site copy and images** (🔶 ASK §1 #9). Images in DA docs use
  `{CONTENT}/media/<file>` (or AEM Assets publish URLs). Locally they map to `/media-da/media/<file>`.

### TMX block docs (reference)

| Block | Variants documented |
|-------|---------------------|
| Accordion | default |
| Author | default (with photo), media contact (no photo): rows Photo, Name, Role, Phone, Email, Link |
| Card Carousel | default |
| Cards | default, teaser |
| Carousel | default |
| Columns | default (icon list), image and text |
| Embed | YouTube, Vimeo, link only (group) |
| Form | default (`sample-form.json` + submission endpoint) |
| Fragment | author card, disclaimer (`/disclaimers/pov`) |
| Hero | default |
| Modal | link to `/modals/` page (group) |
| News and Insights | default, featured |
| Quote | default, with attribution |
| Search | default, minimal (`sample-search-data/query-index.json`) |
| Section Title | default, centred large |
| Table | default, striped, bordered, no header |
| Tabs | default |
| Video | YouTube with poster, no poster |
| Section Metadata | light, highlight, chevron-heading, legal, background colour, background image |
| Metadata | general, POV, press release field sets |

Also in TMX but **not yet documented**: POV Cards, POV Search. Add example docs for them in a new
project if those blocks exist.

### Sample support files

- `blocks/sample-form.json`: sheet columns `Label, Name, Type, Value, Placeholder, Options, Mandatory,
  Style, Id, Fieldset`. Types: `heading, text, email, select, text-area, checkbox, radio, toggle,
  fieldset, plaintext, submit, confirmation`. 🔶 ASK what a sample form should collect.
- `blocks/sample-search-data/query-index.json`: sheet `path, title, description, lastModified`
  listing a few real pages.
- `blocks/modals/sample-disclaimer`: a short page (heading + two paragraphs) shown in the popup.

---

## 6. Template example docs

A template doc is a **complete page** that DA inserts as a whole: real structure, placeholder copy
telling authors what to write, shared fragments, and a **Metadata table listing every field** the page
type uses (empty rows included), so authors see what to fill in. 🔶 ASK for each page type's
fields; don't assume TMX's.

TMX templates (reference):

| Template | Body | Metadata rows |
|----------|------|---------------|
| Home Page | carousel, statement section, teaser cards, News and Insights + press list, columns | Title, Description, Template `home` |
| POV Article | `h1` headline, text, footnotes (`legal` section), `Fragment` → `/disclaimers/pov` | Description, Date, Tags, Image, Author, Template `pov`, Breadcrumbs `true` |
| POV Listing | `h1`, featured News and Insights, cards, legal section | Title, Description, Template `pov`, Breadcrumbs |
| Author Profile | one `Author` table (Photo, Name, Role, Phone, Email, Link), **no** Metadata table (bulk metadata handles robots/template) | — |
| Press Release | `h1` headline, text (no date/city typed), `Fragment` → `/disclaimers/press-release` | Description, Blurb, Date, City, Tags, Contact, Related Document, Related Document Title, Template `press-release`, Breadcrumbs `true` |

Conventions behind these:

- The headline is the page's **first heading**. There's no Title row, so the title is written once
  (Edge Delivery uses the first heading as the page title).
- Links in metadata (Author, Contact, Related Document) are written as the **bare URL** (link text =
  URL), so the value is the URL however it's read.
- Shared content (disclaimers, authors, contacts) are pages referenced by link, not copied.

---

## 7. Clean library previews (site code)

The DA library shows each doc in a preview frame. Library docs must render **without the site
header/footer and without the helper tables**. Add to the project (adapt names; TMX has this on `main`):

`scripts/scripts.js`:

```js
const LIBRARY_PATH = '/docs/library/';
export function isLibraryDoc() {
  return window.location.pathname.includes(LIBRARY_PATH);
}
function removeLibraryMetadata(main) {
  main.querySelectorAll('div.library-metadata, div.library-container-start, div.library-container-end')
    .forEach((el) => el.remove());
  // OPTIONAL (not on TMX main yet): show extra Metadata examples as key/value tables
  // if (isLibraryDoc()) main.querySelectorAll('div.metadata').forEach((el) => { el.className = 'table no-header'; });
}
// loadEager():  if (isLibraryDoc()) document.body.classList.add('library-doc');
//               …then removeLibraryMetadata(main) before decorateMain(main)
// loadLazy():   if (!isLibraryDoc()) { loadHeader(…); loadFooter(…); }
```

`styles/styles.css`:

```css
body.library-doc > header,
body.library-doc > footer {
  display: none;
}
```

Also make sure language redirects or similar never run on library docs (TMX's `scripts/locale.js`
skips them).

---

## 8. Other site-level sheets and settings

| File | Format | TMX content | Ask |
|------|--------|-------------|-----|
| `/placeholders.json` | sheet `Key`, `Text` | `related-document` = "Related Document:", `contact` = "For more information please contact:" | 🔶 labels per language |
| `/metadata.json` (bulk metadata) | sheet `URL` + one column per metadata key | `/authors/**`: Robots `noindex`, Template `pov` | 🔶 rules |
| Query index (site config `content/query.yaml`, admin API) | YAML | below | 🔶 folders/properties |

TMX query index (needs site-admin rights; set by an admin, not from DA):

```yaml
version: 1
indices:
  povs:
    include: [/povs/**]
    exclude: [/povs/, /povs/index]
    target: /povs/query-index.json
    properties:
      title:       { select: 'head > meta[property="og:title"]', value: 'attribute(el, "content")' }
      description: { select: 'head > meta[name="description"]', value: 'attribute(el, "content")' }
      image:       { select: 'head > meta[property="og:image"]', value: 'match(attribute(el, "content"), "https:\/\/[^/]+(\/.*)")' }
      date:        { select: 'head > meta[name="date"]', value: 'attribute(el, "content")' }
      tags:        { select: 'head > meta[property="article:tag"]', values: 'attribute(el, "content")' }
      author:      { select: 'head > meta[name="author"]', value: 'attribute(el, "content")' }
      lastModified: { select: none, value: 'parseTimestamp(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")' }
```

---

## 9. Upload, preview, publish

1. **Local first.** Write docs to `content/docs/library/…` (`.plain.html` = the inner `<main>` content)
   and sheets as `.json`. Check them in the local preview (`/content/docs/library/blocks/<block>`).
2. **Upload** each doc wrapped as
   `<body><header></header><main>…</main><footer></footer></body>`, mapping local image paths
   `/media-da/media/` → `{CONTENT}/media/`:
   `curl -X POST -F "data=@<file>.html;type=text/html" "https://admin.da.live/source/{ORG}/{SITE}/docs/library/<path>.html"`.
   Upload images used by the docs to `{CONTENT}/media/` if they aren't there.
3. **Verify** each upload: GET it back and compare with what you sent. If DA re-saved it with
   formatting only (e.g. cells wrapped in `<p>`, which happens when a page is open in the editor),
   update the local copy to DA's version.
4. **Preview** every doc and sheet: `POST https://admin.hlx.page/preview/{ORG}/{SITE}/main/<path>`.
5. **Publish live** only when the user asks: `POST https://admin.hlx.page/live/{ORG}/{SITE}/main/<path>`.
   To remove a page: unpublish (`DELETE …/live/…`), remove the preview (`DELETE …/preview/…`), then
   `DELETE https://admin.da.live/source/…`. The guard expects wording like
   "Unpublish the <path> page".
6. Save the site config (§2) once the sheets exist.

---

## 10. Gotchas learned on TMX

- The library ignores a variant's description unless `library-metadata` comes **directly after** the block.
- Only the **first** Metadata table on a page becomes page metadata. Extra ones render as an unknown
  "metadata" block unless you add the optional code in §7.
- `.plain.html` doesn't include page metadata. Code that reads another page's details should read the full
  page's `<head>` or the query index.
- A link in a metadata cell may arrive as its text, so write such links as bare URLs.
- Preview stamps a version in DA: a DA save a second after a preview isn't an edit.
- Two sessions working on the same repo: always `git fetch` and compare with `origin/main` first.

---

## 11. Done checklist

- [ ] Site config has `data` (repository + any 🔶 options) and `library` (Blocks, Templates, Icons, extras), with existing rows kept.
- [ ] `blocks.json` (data + options), `templates.json`, `icons.json` previewed. Row counts match the docs.
- [ ] Every block doc and template doc previews **without header/footer** and with no helper tables or broken blocks.
- [ ] DA library panel (open any doc → Library) lists the blocks with descriptions and inserts the templates with their full Metadata table.
- [ ] Typing in a `Tags` field in DA autocompletes from the taxonomy. The site shows labels, and translated labels on translated pages.
- [ ] `placeholders.json`, `metadata.json` and the query index are in place (if 🔶 requested), previewed, and published if asked.
- [ ] `.migration/project.json` `libraryUrl` points at the new `blocks.json`.
- [ ] Tell the user exactly which surfaces changed (local, DA, preview, live).
