import { toClassName } from '../../scripts/aem.js';

/**
 * Article block — the article's teaser data, authored once on the article page and read by
 * listing blocks (e.g. news-and-insights) wherever the article is referenced.
 *
 * Key/value rows: Tags | Date | Image | Summary. On the article page itself only the date and
 * tags are shown (as the byline); image and summary are teaser-only fields.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, value] = row.children;
    const key = toClassName(label?.textContent || '');
    if (!key || !value) return;
    row.classList.add(`article-${key}`);
    label.classList.add('article-label');
    value.classList.add('article-value');

    if (key === 'tags') {
      const tags = value.textContent.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
      const list = document.createElement('ul');
      list.className = 'article-tag-list';
      tags.forEach((tag) => {
        const li = document.createElement('li');
        li.textContent = tag;
        list.append(li);
      });
      if (tags.length) {
        value.textContent = '';
        value.append(list);
      }
    }
  });
}
