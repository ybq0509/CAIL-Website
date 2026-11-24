import fs from 'node:fs';
import { cards } from '../lib/news.mjs';
export default class {
  data() { return { permalink: 'index.html' }; }
  render({ newsEntries, siteSettings }) {
    return fs.readFileSync('src/_includes/home.html', 'utf8').replace('<!-- CAIL_NEWS_CARDS -->', cards(newsEntries, 'news', siteSettings.homepageNewsCount)).replace('<!-- CAIL_EVENT_CARDS -->', cards(newsEntries, 'event', siteSettings.homepageEventsCount));
  }
}
