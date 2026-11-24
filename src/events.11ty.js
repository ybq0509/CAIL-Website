import fs from 'node:fs';
import { cards } from '../lib/news.mjs';
export default class {
  data() { return { permalink: 'events.html' }; }
  render({ newsEntries }) {
    return fs.readFileSync('src/_includes/events.html', 'utf8').replace('<!-- CAIL_NEWS_CARDS -->', cards(newsEntries, 'news')).replace('<!-- CAIL_EVENT_CARDS -->', cards(newsEntries, 'event'));
  }
}
