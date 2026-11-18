/**
 * Loads the AEM Experimentation plugin (plugins/experimentation, adobe/aem-experimentation)
 * only on pages that define an experiment, campaign or audience in their metadata, so other
 * pages download nothing extra.
 *
 * Authoring (page Metadata):
 *   Experiment               an id, e.g. "home-carousel-order"
 *   Experiment Variants      the challenger page(s), e.g. /experiments/home-carousel-order/canada-first
 *   Experiment Variant Names optional display labels for the challengers
 *   Experiment Split         optional, e.g. "50" (the control gets the rest; default: even split)
 *   Experiment Status        Active / Inactive; Experiment Start Date / End Date optional
 * Preview a variant with ?experiment=<id>/<variant>, where <variant> is "control" or
 * "challenger-1", "challenger-2"... (e.g. ?experiment=home-carousel-order/challenger-1).
 * Results come from RUM (clicks count as conversions by default).
 */

/** True when the page has experiment, campaign or audience metadata. */
const isExperimentationEnabled = () => document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
  || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i));

/**
 * Runs the experimentation engine (eager): picks the variant and swaps in its content before
 * the page is decorated.
 * @param {Document} document
 * @param {Object} config experimentation options
 * @returns {Promise<void|null>}
 */
export async function runExperimentation(document, config) {
  // pages without experiments load nothing (no cross-window message listener either)
  if (!isExperimentationEnabled()) return null;

  try {
    // vendored plugin (git subtree), loaded by path: there is no build step to resolve packages
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    return loadEager(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (eager):', error);
    return null;
  }
}

/**
 * Conversion tracking for experiments (plugins/rum-conversion, adobe/aem-rum-conversion).
 * Without it, any click on the page counts as a conversion. Two ways to be more specific:
 *   - page Metadata, as documented by the plugin: Conversion Element (Link / Labeled Link / Form),
 *     Conversion Link Labels, Conversion Name
 *   - section metadata "Conversion Name": every link inside that section (e.g. a carousel's
 *     calls to action) is tracked as that conversion, and nothing else in the section is
 * Runs after the sections are decorated; loads nothing on pages without conversions.
 * @param {Document} document
 * @param {{ getMetadata: Function, toClassName: Function }} context helpers from aem.js
 * @returns {Promise<void>}
 */
export async function runConversionTracking(document, context) {
  const sections = [...document.querySelectorAll('main .section[data-conversion-name]')];
  const pageLevel = !!context.getMetadata('conversion-element');
  if (!sections.length && !pageLevel) return;

  try {
    // eslint-disable-next-line import/no-relative-packages
    const { initConversionTracking } = await import('../plugins/rum-conversion/src/index.js');
    if (pageLevel) await initConversionTracking.call(context, document);
    sections.forEach((section) => {
      const conversionName = section.dataset.conversionName.trim();
      // the plugin's "Link" mode, scoped to this section and named after its metadata
      const sectionContext = {
        ...context,
        getMetadata: (name) => {
          if (name === 'conversion-element') return 'Link';
          if (name === 'conversion-name') return conversionName;
          return context.getMetadata(name);
        },
      };
      initConversionTracking.call(sectionContext, section);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load conversion tracking:', error);
  }
}

/**
 * Loads the simulation panel (lazy). Preview / local only; production never loads it.
 * @param {Document} document
 * @param {Object} config experimentation options
 * @returns {Promise<void|null>}
 */
export async function runExperimentationLazy(document, config) {
  const { host, hostname, origin } = window.location;
  const isPreview = hostname === 'localhost'
    || hostname.endsWith('.page')
    || (typeof config.isProd === 'function' && !config.isProd())
    || (config.prodHost && ![host, hostname, origin].includes(config.prodHost));
  if (!isPreview) return null;

  try {
    // eslint-disable-next-line import/no-relative-packages
    const { loadLazy } = await import('../plugins/experimentation/src/index.js');
    return loadLazy(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (lazy):', error);
    return null;
  }
}
