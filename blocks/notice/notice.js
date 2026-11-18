/**
 * Notice block: a highlighted information box (e.g. "Please Note: Transition in Progress").
 * One cell holding a heading and text; the information icon is added by CSS.
 * @param {Element} block The notice block
 */
export default function decorate(block) {
  const content = block.querySelector(':scope > div > div');
  if (!content) return;
  content.classList.add('notice-content');
  block.replaceChildren(content);
  block.setAttribute('role', 'note');
}
