import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createSliderControls, initSlider, showSlide } from '../../scripts/slider.js';

export { showSlide };

/**
 * Slide options from the optional third cell of a row, e.g. "hide" (comma-separated,
 * case-insensitive). The cell itself is removed: it's an authoring setting, not content.
 * @param {Element} row The slide row
 * @returns {string[]} option names
 */
function readSlideOptions(row) {
  const cell = row.children[2];
  if (!cell) return [];
  cell.remove();
  return cell.textContent.split(',').map((option) => toClassName(option)).filter(Boolean);
}

/**
 * The slide text as one sentence-like string (headings and paragraphs, buttons left out).
 * @param {Element} content The slide content cell
 * @returns {string}
 */
function slideText(content) {
  const clone = content.cloneNode(true);
  clone.querySelectorAll('a').forEach((a) => a.remove());
  return [...clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
    .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((text) => (/[.!?:]$/.test(text) ? text : `${text}.`))
    .join(' ');
}

/**
 * "hide" slides: the image already shows the text, so the slide text isn't displayed on top
 * of it. It becomes the slide's accessible name instead, and the button's link moves to the
 * whole slide.
 * @param {Element} slide The slide
 */
function hideSlideText(slide) {
  const content = slide.querySelector('.carousel-slide-content');
  if (!content) return;
  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  const text = slideText(content);
  const button = content.querySelector('a[href]');

  slide.classList.add('carousel-slide-text-hidden');
  slide.removeAttribute('aria-labelledby');
  const name = heading?.textContent.trim() || text;
  if (name) slide.setAttribute('aria-label', name);
  if (text) slide.dataset.slideText = text;

  if (button) {
    const link = document.createElement('a');
    link.className = 'carousel-slide-link';
    link.href = button.href;
    if (button.target) link.target = button.target;
    link.setAttribute('aria-label', text || button.textContent.trim());
    const image = slide.querySelector('.carousel-slide-image');
    if (image) link.append(...image.childNodes);
    (image || slide).append(link);
  }
  content.remove();
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  const options = readSlideOptions(row);

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    if (!labeledBy.id) labeledBy.id = `${slide.id}-title`;
    slide.setAttribute('aria-labelledby', labeledBy.id);
  }

  if (options.includes('hide')) hideSlideText(slide);

  return slide;
}

export default async function decorate(block) {
  const blockId = getBlockId('carousel');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `carousel-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  slidesWrapper.setAttribute('tabindex', '0');
  slidesWrapper.setAttribute('aria-label', 'Carousel slides');
  block.prepend(slidesWrapper);

  if (!isSingleSlide) {
    const { indicatorsNav, buttonsContainer } = createSliderControls(rows.length);
    block.append(indicatorsNav);
    container.append(buttonsContainer);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, blockId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    initSlider(block);
    slidesWrapper.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      const next = e.key === 'ArrowLeft' ? current - 1 : current + 1;
      e.preventDefault();
      showSlide(block, next, 'smooth');
    });
  }
}
