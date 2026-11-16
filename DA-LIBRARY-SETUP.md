# DA site setup playbook: configuration, AEM Assets, block & template library, autocomplete (taxonomy)

A generic recipe for setting up an AEM Edge Delivery Services site authored in Document Authoring
(DA). Give this file to a new session to recreate the setup for any project. It assumes nothing about
the site's content, page types, blocks or tags. Everything project-specific is collected first.

---

## 0. Instructions for the agent using this file

1. **Collect every input in §1 before writing anything.**
   - Items marked **🔶 ASK** are project-specific: ask the user, using multiple-choice questions where
     possible. **Never invent** tags, labels, page types, copy, images or URLs.
   - Items marked **🔷 DERIVE** can be worked out from the repo or the site configuration. Show the
     result to the user and ask them to confirm.
2. Build everything **locally first** under `content/` (the local preview mirrors DA), check it in
   the local preview, then upload to DA, preview, and publish only if asked.
3. Remote writes (DA config, DA uploads, preview, publish, unpublish, delete) need the user's explicit
   request in their message. If a safety guard blocks one, don't retry or work around it; give the
   user the exact wording to send.
4. Follow the formats in §2–§7 exactly: the DA library and the site code depend on them.
5. Finish with the checks in §10.

Placeholders: `{ORG}`, `{SITE}` (DA org / site), `{PREVIEW}` = `https://main--{SITE}--{ORG}.aem.page`,
`{CONTENT}` = `https://content.da.live/{ORG}/{SITE}`.

---

## 1. Inputs to collect

| # | Input | How |
|---|-------|-----|
| 1 | DA org and site | 🔷 DERIVE from the site configuration: `contentSourceUrl` from `https://admin.hlx.page/sidekick/{org}/{site}/main/config.json` (or `content.source.url` from `https://api.aem.live/{org}/sites/{site}/config.json` for protected sites). Never from fstab.yaml. |
| 2 | AEM Assets (DAM) repository | 🔶 ASK: "Should DA's Assets panel connect to an AEM as a Cloud Service repository? If so, which author host (`author-pXXXX-eYYYY.adobeaemcloud.com`)?" |
| 3 | Asset insertion options | 🔶 ASK (only if #2): "Insert assets as links to AEM rather than copies?" (`aem.assets.image.type` = `link`). "Use Dynamic Media delivery URLs?" (`aem.asset.dm.delivery` = `on`). |
| 4 | Library tabs | Default: **Blocks**, **Templates**, **Icons**. 🔶 ASK whether to add other tools/plugins to the DA library panel (title + URL, optional icon and `experience`, e.g. `fullsize-dialog`). |
| 5 | Blocks to document | 🔷 DERIVE from `blocks/`. Skip structural blocks (`header`, `footer`), internal helpers not meant for authors, and blocks with nothing to show yet. 🔶 Confirm the list, the display order and each block's **variants** (read its CSS/JS for variant classes). |
| 6 | Page types (templates) | 🔷 DERIVE from `templates/` (if the project has page templates) and the site's main page types. 🔶 ASK which page types authors should get as ready-made templates, and for each one its **sections** and **page metadata fields**. |
| 7 | Icons | 🔷 DERIVE from `icons/*.svg` (names without `.svg`). 🔶 Confirm which ones authors use. |
| 8 | Autocomplete lists (taxonomy) | 🔶 ASK: which fields should offer a fixed list of values (typically **Tags**; also e.g. a block option or a metadata field like Template). For each: the values (labels as visitors see them), which blocks the list applies to, and translated labels per language. Generate keys (§4) and confirm them. |
| 9 | Sample content | 🔶 ASK what copy and images to use in the example docs: existing pages on the site, or content the user provides. Avoid lorem ipsum when real content exists. |
| 10 | Labels shown by code | 🔷 DERIVE from the code (any user-facing text the code needs, e.g. button labels). 🔶 ASK for the wording, per language, to put in the placeholders sheet (§7). |
| 11 | Bulk metadata | 🔶 ASK whether some folders need site-wide metadata (e.g. `Robots: noindex` for fragment folders, a default template for a folder). |
| 12 | Query index | 🔶 ASK whether any listing or search needs a query index: which folder, which properties. |
| 13 | Languages | 🔶 ASK which languages the site has and their folders (e.g. `/fr/`). |

---

## 2. Site configuration spreadsheet (DA config at the site root)

DA → the site's root folder → ⚙️ (gear), or `https://da.live/config#/{ORG}/{SITE}/`. It's a
**multi-sheet** spreadsheet.

### Sheet `data`: AEM Assets (DAM) integration

| key | value |
|-----|-------|
| `aem.repositoryId` | 🔶 the AEM author host, e.g. `author-pXXXX-eYYYY.adobeaemcloud.com` |
| `aem.assets.image.type` | *(optional 🔶)* `link` |
| `aem.asset.dm.delivery` | *(optional 🔶)* `on` |

- `aem.repositoryId` connects DA's **Assets** panel to that AEM repository, so authors can browse
  and insert images from AEM Assets. Inserted images then reference the asset's **publish** URL
  (`https://publish-pXXXX-eYYYY.adobeaemcloud.com/content/dam/…`).
- Assets must be **approved / published** in AEM for those URLs to resolve publicly.
- The **org** config (`https://da.live/config#/{ORG}/`) can also hold `aem.repositoryId` (sometimes a
  `delivery-…` host) and editor settings. The site's value applies to the site. Don't change the org
  config unless asked.
- Keep any other existing rows (e.g. `editor.path` entries) untouched.

### Sheet `library`: tabs in the DA library panel

Columns `title`, `path`, `icon`, `experience` (column widths 168 / 529 / 360 / 216):

| title | path | icon | experience |
|-------|------|------|------------|
| Blocks | `{CONTENT}/docs/library/blocks.json` | | |
| Templates | `{CONTENT}/docs/library/templates.json` | | |
| Icons | `{CONTENT}/docs/library/icons.json` | | |
| *(🔶 any extra tool)* | *URL of the tool/plugin* | *(optional icon URL)* | *(optional, e.g. `fullsize-dialog`)* |

### Saving it (API)

Read first (`GET https://admin.da.live/config/{ORG}/{SITE}`) and **keep every existing sheet and row**.
Then POST the whole multi-sheet as a form *value* (sending it as a file upload returns 400):

```sh
curl -X POST -F "config=<config.json" "https://admin.da.live/config/{ORG}/{SITE}"
```

```json
{
  "data": {
    "total": 1, "limit": 1, "offset": 0,
    "data": [ { "key": "aem.repositoryId", "value": "author-pXXXX-eYYYY.adobeaemcloud.com" } ],
    ":colWidths": [141, 340]
  },
  "library": {
    "total": 3, "limit": 3, "offset": 0,
    "data": [
      { "title": "Blocks",    "path": "https://content.da.live/{ORG}/{SITE}/docs/library/blocks.json",    "icon": "", "experience": "" },
      { "title": "Templates", "path": "https://content.da.live/{ORG}/{SITE}/docs/library/templates.json", "icon": "", "experience": "" },
      { "title": "Icons",     "path": "https://content.da.live/{ORG}/{SITE}/docs/library/icons.json",     "icon": "", "experience": "" }
    ],
    ":colWidths": [168, 529, 360, 216]
  },
  ":names": ["data", "library"], ":version": 3, ":type": "multi-sheet"
}
```

If the project uses a coding agent with a block-library setting (e.g. `.migration/project.json`
→ `sites.{SITE}.libraryUrl`), point it at `{PREVIEW}/docs/library/blocks.json` once that's previewed.

---

## 3. Library sheets (`/docs/library/`)

### `blocks.json`: multi-sheet with `data` + `options`

- Sheet **`data`**: columns `name`, `path` (widths 180 / 573). One row per block, in the order authors
  should see them. `path` = `{CONTENT}/docs/library/blocks/<block-doc>` (no extension).
- Sheet **`options`**: columns `blocks`, `key`, `values` (widths 160 / 120 / 420). These are the
  **autocomplete lists** (§4).

```json
{
  "data": {
    "total": 2, "limit": 2, "offset": 0,
    "data": [
      { "name": "Hero",  "path": "https://content.da.live/{ORG}/{SITE}/docs/library/blocks/hero" },
      { "name": "Cards", "path": "https://content.da.live/{ORG}/{SITE}/docs/library/blocks/cards" }
    ],
    ":colWidths": [180, 573]
  },
  "options": {
    "total": 1, "limit": 1, "offset": 0,
    "data": [ { "blocks": "all", "key": "tags", "values": "Label One=label-one|Label Two=label-two" } ],
    ":colWidths": [160, 120, 420]
  },
  ":names": ["data", "options"], ":version": 3, ":type": "multi-sheet"
}
```

If there are no autocomplete lists yet, a single `data` sheet is enough
(`":sheetname": "data", ":type": "sheet"`).

### `templates.json`: single sheet

Columns `key` (template name shown to authors) and `value` (`{CONTENT}/docs/library/templates/<name>`),
widths 160 / 573.

### `icons.json`: single sheet

One column `key` = the icon name (`icons/<name>.svg`), width 160. Authors insert icons as `:name:`.

### Uploading a sheet

```sh
curl -X POST -F "data=@blocks.json;type=application/json" "https://admin.da.live/source/{ORG}/{SITE}/docs/library/blocks.json"
curl -X POST "https://admin.hlx.page/preview/{ORG}/{SITE}/main/docs/library/blocks.json"
```

---

## 4. Autocomplete lists (taxonomy)

**🔶 ASK the user for every list. Never reuse values from another project.**

The `options` sheet of `blocks.json` holds value lists that DA offers as autocomplete when an author
fills a row with that key, in a block or in the page **Metadata** table.

| Column | Meaning |
|--------|---------|
| `blocks` | where the list applies: `all`, or block names (comma-separated), e.g. `metadata`, `cards` |
| `key` | the row key authors type, e.g. `tags`, `template`, `style` |
| `values` | options separated by `\|`, each `Label=value` (label shown to authors, value stored), or just `value` |

Typical rows (🔶 ASK which apply):

- `all` / `tags`: the approved tags, e.g. `Product News=product-news|Events=events`
- `metadata` / `template`: the page templates, e.g. `Article=article|Landing=landing`
- `section-metadata` / `style`: the section styles the CSS supports, e.g. `light|dark|center`
- A filter/search block / `categories`: the subset of tags offered as filter categories
- `all` / `tags-<locale>` (e.g. `tags-fr`): **the same values** with translated labels, one row per language

Rules for tags:

- **Values (keys)** are stable identifiers: lowercase, words joined by `-`, punctuation and `&` dropped
  (`Oil & Gas` → `oil-gas`). Never change a key once content uses it; change the label instead.
- Content stores **keys**. If the site displays tags, the code should read this sheet
  (`{PREVIEW}/docs/library/blocks.json`, sheet `options`, row `tags`, or `tags-<locale>` on translated pages)
  and show the label. 🔶 ASK whether tags need a prefix (e.g. `#`) when displayed.
- In page metadata, a `Tags` row is delivered as `<meta property="article:tag">` tags (one per tag),
  which the query index can store as a list.

Questions to ask (example wording):

1. "Which fields should offer a fixed list of values? (Tags, template, section styles, a block option…)"
2. "For each list, paste the values exactly as visitors or authors should see them."
3. "Which blocks does each list apply to?"
4. "Which languages need translated labels? Please give each translation."

---

## 5. Library folder structure and block example docs

```
/docs/library/
  blocks.json                 data (+ options) sheet(s) (§3, §4)
  templates.json
  icons.json
  blocks/
    <block>                   one example doc per block (one section per variant)
    …support content          e.g. a sample form sheet, a sample search index, a popup page
  templates/
    <template>                one ready-to-fill page per template
```

Locally the same tree lives under `content/docs/library/` (docs as `<name>.plain.html`, sheets as `.json`).

### Variant format (exactly this; the DA library depends on it)

Each variant is **one section** (`<div>`) containing, in this order:

```html
<div>
  <h2>Cards (no images)</h2>                       <!-- variant name shown in the library -->
  <div class="cards no-images"> …block rows… </div> <!-- the block, with real sample content -->
  <div class="library-metadata">                    <!-- directly AFTER the block -->
    <div><div>description</div><div>What it's for, when to use it, and how to fill its rows and cells.</div></div>
    <div><div>searchtags</div><div>cards, grid, tiles</div></div>
  </div>
</div>
```

- The library takes the **variant name from the heading directly before the block** (otherwise from
  its class names), and the **description / searchtags from the `library-metadata` table directly
  after it**.
- **Default content** (e.g. a bare link that the site auto-embeds as a video or opens as a modal) is
  wrapped in group markers. The library inserts everything between them:

```html
<div>
  <h2>Embed (link only)</h2>
  <div class="library-container-start"><div><div></div></div></div>
  <p><a href="https://www.youtube.com/watch?v=VIDEO_ID">https://www.youtube.com/watch?v=VIDEO_ID</a></p>
  <div class="library-container-end"><div><div></div></div></div>
  <div class="library-metadata"><div><div>description</div><div>A bare video link on its own line becomes an embed.</div></div></div>
</div>
```

- **Section Metadata** doc: one section per style the CSS supports:
  `<h2>Section: <style></h2>` + a `section-metadata` table (`style` = that style) + `library-metadata`
  + some sample text so the style is visible.
- **Metadata** doc: one section per field set (general, plus one per page type if they differ). Only
  the first Metadata table becomes the doc's page metadata (see the optional code in §8).
- One doc per block, named after the block folder (`blocks/<block>`), variants in a sensible order
  (default first).
- Descriptions are written **for authors**: purpose, rows/cells, variants, when to use another block.
- Use **real site content** (🔶 §1 #9). Images in DA docs use `{CONTENT}/media/<file>` or AEM Assets
  publish URLs. If the local preview serves media from another folder, map the paths on upload.

### Support content for blocks that need data

Create these only for blocks that exist in the project:

| Block needs | Support content | Format |
|-------------|-----------------|--------|
| A form definition | `blocks/sample-form.json` | sheet with the columns the form block reads (commonly `Label, Name, Type, Value, Placeholder, Options, Mandatory, Style, Id, Fieldset`); 🔶 ASK what the sample form collects |
| A search/listing index | `blocks/sample-search-data/query-index.json` | sheet with the columns the block reads (commonly `path, title, description, lastModified`), listing a few real pages |
| A popup/modal page | `blocks/modals/<name>` | a short page; link to it from the Modal example |
| A fragment | an existing shared page | the Fragment example links to it |

---

## 6. Template example docs

A template doc is a **complete page** that DA inserts as a whole: the page type's real structure
(sections, blocks, shared fragments), placeholder copy telling authors what to write, and a
**Metadata table listing every field** the page type uses (empty rows included), so authors see what
to fill in. 🔶 ASK for each page type's structure and fields; don't assume them.

```html
<div>
  <h1>Page headline</h1>
  <p>Opening paragraph: what this page type usually says first.</p>
  …sections and blocks of this page type…
</div>
<div>
  <div class="metadata">
    <div><div>Description</div><div>One or two sentences for search and social sharing.</div></div>
    <div><div>Template</div><div>{template-name}</div></div>
    …one row per field of this page type, values empty or as hints…
  </div>
</div>
```

Conventions worth applying:

- If the page's first heading is its title, leave **Title** out of the Metadata table. Edge Delivery
  uses the first heading as the page title, so the title is written once.
- Write links in metadata (references to other pages, documents) as **bare URLs** (link text = URL),
  so the value is the URL however the cell is read.
- Reuse shared content (fragments) by linking to it, rather than copying it into each template.

---

## 7. Other site-level sheets and settings (optional, 🔶 ASK)

| File | Format | Purpose |
|------|--------|---------|
| `/placeholders.json` | sheet with columns `Key`, `Text` | User-facing labels the code needs (no hard-coded copy). One sheet, or one per language folder. |
| `/metadata.json` (bulk metadata) | sheet `URL` + one column per metadata key | Site-wide metadata by path pattern, e.g. `URL: /fragments/**`, `Robots: noindex`. |
| Query index | YAML in the site configuration (`content/query.yaml`, admin API; needs site-admin rights) | Makes a folder's pages available as JSON for listings and search. |

Query index skeleton (🔶 ASK for the folder and properties):

```yaml
version: 1
indices:
  {index-name}:
    include: [/{folder}/**]
    exclude: [/{folder}/, /{folder}/index]
    target: /{folder}/query-index.json
    properties:
      title:       { select: 'head > meta[property="og:title"]', value: 'attribute(el, "content")' }
      description: { select: 'head > meta[name="description"]', value: 'attribute(el, "content")' }
      image:       { select: 'head > meta[property="og:image"]', value: 'match(attribute(el, "content"), "https:\/\/[^/]+(\/.*)")' }
      tags:        { select: 'head > meta[property="article:tag"]', values: 'attribute(el, "content")' }
      lastModified: { select: none, value: 'parseTimestamp(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")' }
```

Custom metadata fields are available as `head > meta[name="<field>"]` (field name lowercased, spaces → `-`).

---

## 8. Clean library previews (site code)

The DA library shows each doc in a preview frame. Library docs should render **without the site
header/footer and without the helper tables**, so the preview shows only the block or template. Add to
the project:

`scripts/scripts.js`:

```js
const LIBRARY_PATH = '/docs/library/';

export function isLibraryDoc() {
  return window.location.pathname.includes(LIBRARY_PATH);
}

function removeLibraryMetadata(main) {
  main.querySelectorAll('div.library-metadata, div.library-container-start, div.library-container-end')
    .forEach((el) => el.remove());
  // optional: show extra Metadata examples (only the first becomes page metadata) as key/value tables
  if (isLibraryDoc()) {
    main.querySelectorAll('div.metadata').forEach((el) => { el.className = 'table no-header'; });
  }
}

// in loadEager():  if (isLibraryDoc()) document.body.classList.add('library-doc');
//                  …and call removeLibraryMetadata(main) before decorateMain(main)
// in loadLazy():   only load the header and footer when !isLibraryDoc()
```

(The optional line assumes a Table block with a `no-header` variant. Drop it if there's none.)

`styles/styles.css`:

```css
body.library-doc > header,
body.library-doc > footer {
  display: none;
}
```

Any behaviour that would move a visitor away from the page (redirects, popups on load) should also be
skipped on library docs and inside frames.

---

## 9. Upload, preview, publish

1. **Local first.** Write docs to `content/docs/library/…` (`.plain.html` = the inner `<main>` content)
   and sheets as `.json`. Check each in the local preview: no header/footer, no helper tables, every
   block loads.
2. **Upload** each doc wrapped as `<body><header></header><main>…</main><footer></footer></body>`:
   `curl -X POST -F "data=@<file>.html;type=text/html" "https://admin.da.live/source/{ORG}/{SITE}/docs/library/<path>.html"`.
   Upload any images the docs use to `{CONTENT}/media/` if they aren't there.
3. **Verify** each upload: GET it back and compare with what you sent. If DA re-saved it with
   formatting differences only (e.g. cells wrapped in `<p>`, which happens when the doc is open in the
   editor), update the local copy to DA's version.
4. **Preview** every doc and sheet: `POST https://admin.hlx.page/preview/{ORG}/{SITE}/main/<path>`.
5. **Publish live** only when the user asks: `POST https://admin.hlx.page/live/{ORG}/{SITE}/main/<path>`.
   To remove a doc: unpublish (`DELETE …/live/…`), remove the preview (`DELETE …/preview/…`), then delete
   it in DA (`DELETE https://admin.da.live/source/…`). The safety guard expects explicit wording such as
   "Unpublish the <path> page".
6. Save the site configuration (§2) once the sheets exist, so the library tabs resolve.

### Lessons learned

- The library ignores a variant's description unless `library-metadata` comes **directly after** the block.
- Only the **first** Metadata table on a page becomes page metadata.
- `.plain.html` doesn't include page metadata. Code that reads another page's metadata should read
  the full page's `<head>` or a query index.
- A link in a metadata cell may arrive as its text, so write such links as bare URLs.
- Previewing stamps a version in DA: a DA save a second after a preview isn't an edit.
- If more than one session works on the repo, `git fetch` and compare with `origin/main` before building.

---

## 10. Done checklist

- [ ] Site config: `data` (AEM Assets repository + any 🔶 options) and `library` (Blocks, Templates, Icons, extras), existing rows kept.
- [ ] `blocks.json` (data + options if any), `templates.json`, `icons.json` uploaded and previewed. Row counts match the docs.
- [ ] Every block and template doc previews **without header/footer**, with no helper tables and no failed blocks.
- [ ] DA library panel (open any doc → Library) lists the blocks with descriptions and inserts the templates with their full Metadata table.
- [ ] DA Assets panel browses the AEM repository (if configured) and inserted images resolve.
- [ ] Autocomplete offers the configured values in the right blocks/fields. Translated labels exist for each language (if requested).
- [ ] Optional sheets (`placeholders.json`, `metadata.json`) and the query index are in place if requested, previewed, and published if asked.
- [ ] Tell the user exactly which surfaces changed (local, DA, preview, live).
