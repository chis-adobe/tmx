/**
 * Site languages. English pages live at the site root; translations live in a language folder
 * (/fr/...). A folder may be renamed in a translation (English /povs/ is French /fr/pov/).
 *
 * French-locale visitors who land on an English page are sent to its French version when one
 * exists. Choosing a language with the header's language link is remembered and overrides the
 * browser language from then on.
 */
// eslint-disable-next-line import/no-cycle
import { isLibraryDoc, resolveContentPath } from './scripts.js';

export const DEFAULT_LOCALE = 'en';
export const LOCALES = ['en', 'fr'];

/** English top-level folder -> its name in each translation. */
const FOLDERS = { fr: { povs: 'pov' } };

const PREFERENCE_KEY = 'tmx-locale';
const LOCAL_CONTENT_PREFIX = '/content';

/** The site path of the current page (without the local preview's /content prefix). */
export function currentSitePath() {
  const { pathname } = window.location;
  if (pathname.startsWith(`${LOCAL_CONTENT_PREFIX}/`)) {
    const path = pathname.slice(LOCAL_CONTENT_PREFIX.length);
    return path === '/index' ? '/' : path.replace(/\/index$/, '/');
  }
  return pathname;
}

/**
 * Language of a site path: its language folder, else the default (English).
 * @param {string} [path] Site path (defaults to the current page)
 * @returns {string}
 */
export function getLocale(path = currentSitePath()) {
  const first = path.split('/')[1];
  return LOCALES.includes(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
}

/**
 * The same page's path in another language (whether or not that page exists).
 * e.g. ('/povs/my-pov', 'fr') -> '/fr/pov/my-pov'; ('/fr/', 'en') -> '/'.
 * @param {string} path Site path in any language
 * @param {string} locale Target language
 * @returns {string}
 */
export function localizePath(path, locale) {
  const from = getLocale(path);
  let segments = path.split('/').slice(1);
  if (from !== DEFAULT_LOCALE) {
    segments = segments.slice(1);
    const english = Object.entries(FOLDERS[from] || {}).find(([, name]) => name === segments[0]);
    if (english) [segments[0]] = english;
  }
  if (locale !== DEFAULT_LOCALE) {
    const folder = FOLDERS[locale]?.[segments[0]];
    if (folder) segments[0] = folder;
    segments = [locale, ...segments];
  }
  return `/${segments.join('/')}`;
}

/** Remembers the visitor's language choice (made with the header's language link). */
export function rememberLocale(locale) {
  try {
    localStorage.setItem(PREFERENCE_KEY, locale);
  } catch { /* storage unavailable: the choice applies to this visit only */ }
}

function storedLocale() {
  try {
    const value = localStorage.getItem(PREFERENCE_KEY);
    return LOCALES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** The visitor's preferred language: their remembered choice, else the browser's language. */
export function preferredLocale() {
  const stored = storedLocale();
  if (stored) return stored;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const first = String(languages[0] || '').toLowerCase().split('-')[0];
  return LOCALES.includes(first) ? first : DEFAULT_LOCALE;
}

const existsCache = new Map();

/**
 * Whether a page exists (HEAD request, cached per page view).
 * @param {string} path Site path
 * @returns {Promise<boolean>}
 */
export function pageExists(path) {
  if (!existsCache.has(path)) {
    existsCache.set(path, fetch(resolveContentPath(path), { method: 'HEAD' })
      .then((resp) => resp.ok)
      .catch(() => false));
  }
  return existsCache.get(path);
}

/** Authoring contexts (editors, previews in frames, library docs) never redirect. */
function inAuthoringContext() {
  const { hostname, search } = window.location;
  return window.top !== window.self
    || hostname.includes('ue.da.live')
    || /[?&](dapreview|quick-edit)=/.test(search)
    || isLibraryDoc();
}

/**
 * Sends the visitor to the version of this page in their preferred language, when that
 * version exists. Only pages in the default language redirect, so choosing English on a
 * translated page always sticks.
 * @returns {Promise<boolean>} true when a redirect has started
 */
export async function redirectToPreferredLocale() {
  const preferred = preferredLocale();
  const path = currentSitePath();
  if (preferred === DEFAULT_LOCALE || getLocale(path) !== DEFAULT_LOCALE || inAuthoringContext()) {
    return false;
  }
  const target = localizePath(path, preferred);
  if (!(await pageExists(target))) return false;
  const { search, hash } = window.location;
  window.location.replace(`${resolveContentPath(target)}${search}${hash}`);
  return true;
}
