/**
 * Tag taxonomy. Approved tags live in the "options" sheet of the block library
 * (/docs/library/blocks.json), as "Label=key" pairs separated by "|" in the row whose key is
 * "tags". DA uses that row to autocomplete Tags fields; the site uses it to show labels.
 *
 * Content stores tag keys only (e.g. "tsx30, mining"), never a "#": where TMX shows hashtags,
 * the code adds the "#" when it displays the label (formatTag(key, { hash: true })).
 */
import { toClassName } from './aem.js';
import { resolveContentPath } from './scripts.js';

const OPTIONS_SHEET = '/docs/library/blocks.json';
const TAGS_KEY = 'tags';

/** key -> label, filled by loadTaxonomy() */
const labels = new Map();
let loading;

/**
 * Parses an options "values" cell: "Label=key|Other=other|plain" -> [[key, label], ...].
 * @param {string} values
 * @returns {Array<[string, string]>}
 */
export function parseOptionValues(values) {
  return String(values || '').split('|').map((item) => item.trim()).filter(Boolean)
    .map((item) => {
      const i = item.lastIndexOf('=');
      const label = (i > 0 ? item.slice(0, i) : item).trim();
      const key = toClassName(i > 0 ? item.slice(i + 1) : item);
      return [key, label];
    })
    .filter(([key]) => key);
}

/**
 * Loads the approved tags (once per page). Resolves to the key -> label map; an unreadable
 * sheet resolves to an empty map, and tags then show their key.
 * @returns {Promise<Map<string, string>>}
 */
export function loadTaxonomy() {
  if (!loading) {
    loading = fetch(`${resolveContentPath(OPTIONS_SHEET.replace(/\.json$/, ''))}.json?sheet=options`)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => {
        const row = (json.data || []).find((r) => toClassName(r.key) === TAGS_KEY);
        parseOptionValues(row?.values).forEach(([key, label]) => labels.set(key, label));
        return labels;
      })
      .catch(() => labels);
  }
  return loading;
}

/**
 * Splits an authored tags value into tag keys. Keys are separated by commas or spaces; older
 * values ("#TSX30 #Mining", "Life Sciences") are normalized to keys too.
 * @param {string} value
 * @returns {string[]}
 */
export function tagKeys(value) {
  const text = String(value || '').replace(/#/g, '').trim();
  if (!text) return [];
  // commas separate tags when present; otherwise spaces do, unless the whole value is one
  // known tag (e.g. "Life Sciences")
  const whole = toClassName(text);
  if (!text.includes(',') && labels.has(whole)) return [whole];
  const parts = text.includes(',') ? text.split(',') : text.split(/\s+/);
  return [...new Set(parts.map((part) => toClassName(part)).filter(Boolean))];
}

/** Display label for a tag key (the key itself when it is not in the taxonomy). */
export function tagLabel(key) {
  return labels.get(key) || key;
}

/**
 * Text to show for a tag.
 * @param {string} key Tag key
 * @param {object} [options]
 * @param {boolean} [options.hash] Prefix "#" (TMX shows POV tags as hashtags)
 * @returns {string}
 */
export function formatTag(key, { hash = false } = {}) {
  return `${hash ? '#' : ''}${tagLabel(key)}`;
}
