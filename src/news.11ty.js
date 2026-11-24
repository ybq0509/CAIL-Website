import fs from 'node:fs';
import { article } from '../lib/news.mjs';
import { load } from 'cheerio';
export default class {
  data() { return { pagination: { data: 'newsEntries', size: 1, alias: 'entry', before: entries => entries.filter(entry => entry.visibility !== 'hidden') }, permalink: data => `${data.entry.slug}.html` }; }
  render({ entry }) {
    const $ = load(fs.readFileSync('src/_includes/article.html', 'utf8').replace('<!-- CAIL_ARTICLE -->', article(entry)));
    $('title').text(entry.title + ' | CAIL · HKUST');
    $('meta[name="description"]').remove();
    $('head').append($('<meta name="description">').attr('content', entry.summary));
    $('head').append('<link rel="stylesheet" href="assets/news-content.css"/>');
    $('body').append('<script src="assets/news-language.js" defer></script>');
    return $.html();
  }
}
