import { readBlockConfig } from '../../scripts/aem.js';
import { getBlockId } from '../../scripts/scripts.js';
import {
  POV_INDEX, cardHeadingLevel, loadPovIndex, renderPovCard, toSitePath,
} from '../../scripts/pov.js';
import { loadTaxonomy, tagKeys, tagLabel } from '../../scripts/taxonomy.js';

/**
 * POV Search block — searches the POV query index and lists matching POVs as small cards
 * (image beside title, date, tags), newest first, with a "load more" button.
 *
 * Key/value rows (all labels are authored, nothing is hard-coded):
 *   Placeholder  search field placeholder (also its accessible label)
 *   Search       search button label
 *   Category     first option of the category list ("all categories")
 *   Categories   comma-separated tag keys from the taxonomy (shown with their labels); a POV
 *                matches when it carries the tag
 *   Filter       filter button label
 *   Reset        reset button label
 *   Load More    load-more button label
 *   No Results   message shown when nothing matches
 *   Page Size    results shown per page (default 6)
 *   Source       optional query index path (default /povs/query-index.json)
 * The search state is kept in the URL (?q=…&category=…) so results can be shared.
 */

const DEFAULT_PAGE_SIZE = 6;

const normalize = (value) => String(value || '').toLowerCase().replace(/#/g, '').trim();

function dateValue(pov) {
  const parsed = Date.parse(pov.date);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function matches(pov, terms, category) {
  // keywords match the title, description and tag labels; a category matches by tag key
  const text = normalize([pov.title, pov.description, ...pov.tags.map(tagLabel)].join(' '));
  if (!terms.every((term) => text.includes(term))) return false;
  return !category || pov.tags.includes(category);
}

function button(label, className, type = 'button') {
  const el = document.createElement('button');
  el.type = type;
  el.className = className;
  el.textContent = label;
  return el;
}

function buildForm(config, id) {
  const form = document.createElement('form');
  form.className = 'pov-search-form';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.id = `${id}-q`;
  input.placeholder = config.placeholder || '';
  if (config.placeholder) input.setAttribute('aria-label', config.placeholder);

  const select = document.createElement('select');
  select.name = 'category';
  if (config.category) select.setAttribute('aria-label', config.category);
  const all = document.createElement('option');
  all.value = '';
  all.textContent = config.category || '';
  select.append(all);
  tagKeys([].concat(config.categories || []).join(',')).forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = tagLabel(key);
    select.append(option);
  });

  const searchRow = document.createElement('div');
  searchRow.className = 'pov-search-query';
  searchRow.append(input, button(config.search || '', 'pov-search-submit', 'submit'));

  const filterRow = document.createElement('div');
  filterRow.className = 'pov-search-filters';
  filterRow.append(
    select,
    button(config.filter || '', 'pov-search-filter', 'submit'),
    button(config.reset || '', 'pov-search-reset secondary', 'reset'),
  );

  form.append(searchRow, filterRow);
  return { form, input, select };
}

/**
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  await loadTaxonomy();
  const id = getBlockId('pov-search');
  const pageSize = Math.max(1, parseInt(config['page-size'], 10) || DEFAULT_PAGE_SIZE);
  const source = toSitePath(config.source || POV_INDEX) || POV_INDEX;
  const headingLevel = cardHeadingLevel(block);

  const { form, input, select } = buildForm(config, id);
  const status = document.createElement('p');
  status.className = 'pov-search-status';
  status.setAttribute('role', 'status');
  const results = document.createElement('ul');
  results.className = 'pov-search-results';
  results.id = `${id}-results`;
  const more = button(config['load-more'] || '', 'pov-search-more secondary');
  more.setAttribute('aria-controls', results.id);
  more.hidden = true;

  block.replaceChildren(form, status, results, more);

  const all = (await loadPovIndex(source)).sort((a, b) => dateValue(b) - dateValue(a));
  let matched = [];
  let shown = 0;

  const showNext = () => {
    matched.slice(shown, shown + pageSize).forEach((pov) => {
      const li = document.createElement('li');
      li.append(renderPovCard(pov, { layout: 'small', headingLevel }));
      results.append(li);
    });
    shown = Math.min(shown + pageSize, matched.length);
    more.hidden = shown >= matched.length;
  };

  const run = () => {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    const category = select.value;
    matched = all.filter((pov) => matches(pov, terms, category));
    shown = 0;
    results.replaceChildren();
    status.textContent = matched.length ? '' : (config['no-results'] || '');
    showNext();

    const url = new URL(window.location.href);
    ['q', 'category'].forEach((key) => url.searchParams.delete(key));
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    if (category) url.searchParams.set('category', category);
    window.history.replaceState(null, '', url);
  };

  // restore a shared search from the URL
  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') || '';
  const category = tagKeys(params.get('category'))[0] || '';
  if ([...select.options].some((o) => o.value === category)) select.value = category;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  // run after the form has cleared its fields
  form.addEventListener('reset', () => setTimeout(run));
  more.addEventListener('click', showNext);

  run();
}
