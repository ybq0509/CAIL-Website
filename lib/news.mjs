import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { load } from 'cheerio';

export const locales = ['en', 'zh', 'zhHant'];
export const categories = {
  'event-report': ['Event report', '活动报道', '活動報道'],
  'research': ['Research news', '研究动态', '研究動態'],
  'media': ['Media coverage', '媒体报道', '媒體報道'],
  'award': ['Award', '奖项', '獎項'],
  'call-for-papers': ['Call for papers', '征稿启事', '徵稿啟事'],
  'announcement': ['Announcement', '通知', '通知'],
};
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const md = new MarkdownIt({ html: true, linkify: true });
export function renderBody(body = '') {
  return sanitizeHtml(md.render(body), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'figure', 'img', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'hr'],
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'title', 'loading'], figure: ['class'] },
    allowedClasses: { figure: ['news-article-figure', 'is-poster'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: { img: (tag, attrs) => ({ tagName: tag, attribs: { ...attrs, loading: 'lazy' } }) },
  });
}
export const translation = (entry, locale) => locale === 'en' ? entry : entry[locale];
export function multilingual(tag, texts, attrs = '') {
  const values = Array.isArray(texts) ? texts : locales.map(locale => texts[locale]);
  return `<${tag} ${attrs} data-en="${escape(values[0])}" data-zh="${escape(values[1])}" data-zh-hant="${escape(values[2])}">${escape(values[0])}</${tag}>`;
}
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function validateEntry(entry, filename, root = process.cwd()) {
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug || '')) errors.push('网址标识必须为小写英文字母、数字和连字符');
  if (['index', 'events', 'admin', '404'].includes(entry.slug)) errors.push('该网址为系统保留网址');
  if (filename && path.basename(filename, '.json') !== entry.slug) errors.push('网址标识必须与文件名一致，已发布文章请保留原网址');
  if (!['news', 'event'].includes(entry.section)) errors.push('请选择新闻或活动栏目');
  if (!Object.hasOwn(categories, entry.category)) errors.push('请选择有效分类');
  if (!['published', 'archived', 'hidden'].includes(entry.visibility)) errors.push('无效的显示状态');
  if (!entry.publishedAt && !(entry.publicationDateNeedsReview && validDate(entry.legacyDate))) errors.push('请填写新闻发布日期');
  for (const field of ['publishedAt', 'eventDate', 'legacyDate']) {
    if (entry[field] && !validDate(entry[field])) errors.push(`${field} 日期格式应为 YYYY-MM-DD`);
  }
  if (entry.publishedAt && entry.publishedAt > new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(new Date())) errors.push('发布日期不能在未来；活动日期请填写在活动日期栏');
  if (typeof entry.featured !== 'boolean' || !Number.isInteger(entry.priority) || entry.priority < 0 || entry.priority > 100) errors.push('首页推荐或优先级无效');
  const assets = [entry.cover];
  for (const locale of locales) {
    const text = translation(entry, locale);
    for (const field of ['title', 'summary', 'body']) if (typeof text?.[field] !== 'string' || !text[field].trim()) errors.push(`${locale} 缺少 ${field}`);
    const $ = load(renderBody(text?.body || ''));
    $('img').each((_, image) => assets.push($(image).attr('src')));
  }
  for (const asset of assets) {
    const clean = String(asset || '').replace(/^\//, '');
    if (!clean.startsWith('assets/') || clean.split('/').some(part => part === '..') || clean.includes('\\') || !fs.existsSync(path.join(root, clean))) errors.push(`图片不存在或路径无效：${asset}`);
  }
  if (!entry.coverAlt?.trim()) errors.push('请填写封面图片描述');
  if (errors.length) throw new Error(`${entry.slug || filename}: ${errors.join('；')}`);
  return entry;
}
export function readEntries(root = process.cwd()) {
  const entries = fs.readdirSync(path.join(root, 'content/news')).filter(file => file.endsWith('.json')).map(file => validateEntry(JSON.parse(fs.readFileSync(path.join(root, 'content/news', file), 'utf8')), file, root));
  const slugs = new Set(entries.map(entry => entry.slug));
  if (slugs.size !== entries.length) throw new Error('新闻网址重复');
  const staticPages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
  const legacyRoutes = JSON.parse(fs.readFileSync(path.join(root, 'content/legacy-routes.json'), 'utf8'));
  for (const entry of entries) if (staticPages.includes(entry.slug + '.html') && !legacyRoutes.includes(entry.slug)) throw new Error(`新闻网址与现有页面冲突：${entry.slug}`);
  return entries;
}
export function sortEntries(entries, featured = false) {
  return [...entries].sort((a, b) => (featured ? b.priority - a.priority : 0) || (b.publishedAt || '').localeCompare(a.publishedAt || '') || a.slug.localeCompare(b.slug));
}
export function cards(entries, section, limit) {
  let selected = entries.filter(entry => entry.visibility === 'published' && entry.section === section && (limit === undefined || entry.featured));
  selected = sortEntries(selected, limit !== undefined);
  if (limit !== undefined) selected = selected.slice(0, limit);
  return selected.map(entry => `<article class="home-news-card"><a href="${entry.slug}.html"><img class="home-news-image" loading="lazy" src="${escape(entry.cover)}" alt="${escape(entry.coverAlt)}"/></a><div class="card-copy"><time class="news-type" datetime="${escape(section === 'event' ? entry.eventDate || entry.publishedAt : entry.publishedAt || entry.legacyDate)}">${escape(section === 'event' ? entry.eventDate || entry.publishedAt : entry.publishedAt || entry.legacyDate)}</time><h3><a href="${entry.slug}.html">${multilingual('span', Object.fromEntries(locales.map(locale => [locale, translation(entry, locale).title])))}</a></h3>${multilingual('p', Object.fromEntries(locales.map(locale => [locale, translation(entry, locale).summary])), 'class="news-summary"')}</div></article>`).join('');
}
export function article(entry) {
  const title = Object.fromEntries(locales.map(locale => [locale, translation(entry, locale).title]));
  const category = categories[entry.category];
  const dates = (entry.publishedAt ? `<time datetime="${entry.publishedAt}">${entry.publishedAt}</time>` : '') + (entry.eventDate && entry.eventDate !== entry.publishedAt ? ` ${multilingual('span', ['Event date', '活动日期', '活動日期'])} <time datetime="${entry.eventDate}">${entry.eventDate}</time>` : '');
  return `<div class="page-head wrap event-report-head"><nav aria-label="Breadcrumb" class="breadcrumbs"><a href="index.html">${multilingual('span', ['Home', '首页', '首頁'])}</a><span>/</span><a href="events.html#${entry.section === 'event' ? 'past' : 'news'}">${multilingual('span', entry.section === 'event' ? ['Events', '活动', '活動'] : ['News', '新闻', '新聞'])}</a><span>/</span>${multilingual('span', category)}</nav><h1 id="event-report-title">${multilingual('span', title)}</h1><div class="event-report-meta">${multilingual('span', category)} ${dates}</div></div><article class="wrap event-report" aria-labelledby="event-report-title">${multilingual('p', Object.fromEntries(locales.map(locale => [locale, translation(entry, locale).summary])), 'class="event-report-lead"')}${locales.map((locale, index) => `<div data-news-language="${locale}"${index ? ' hidden' : ''}>${renderBody(translation(entry, locale).body)}</div>`).join('')}<a class="text-link" href="events.html">${multilingual('span', ['All events and news', '全部活动与新闻', '全部活動與新聞'])}</a></article>`;
}
