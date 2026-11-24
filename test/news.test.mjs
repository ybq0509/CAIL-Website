import test from 'node:test';
import assert from 'node:assert/strict';
import { readEntries, cards, article, renderBody, validateEntry, sortEntries } from '../lib/news.mjs';
import { load } from 'cheerio';

test('迁移内容完整且保持独立三语正文', () => {
  const entries = readEntries();
  for (const entry of entries) {
    const $ = load(article(entry)); assert.equal($('[data-news-language]').length, 3);
    assert.ok($('[data-news-language="zh"]').text().includes(entry.zh.body.match(/[\u4e00-\u9fff]{3,}/)?.[0] || ''));
  }
});
test('首页按推荐优先级、发布日期排序，未来活动日期不充当新闻发布日期', () => {
  const base = {section:'news',visibility:'published',featured:true,priority:0,cover:'/assets/hkust-piazza.jpg',coverAlt:'Campus',title:'News',summary:'Summary',zh:{title:'新闻',summary:'摘要'},zhHant:{title:'新聞',summary:'摘要'}};
  const entries = [{...base,slug:'recent',publishedAt:'2026-11-06'}, {...base,slug:'older',publishedAt:'2026-09-22'}, {...base,slug:'earlier',publishedAt:'2026-09-06'}, {...base,slug:'future-event',publishedAt:'',eventDate:'2027-02-08',legacyDate:'2027-02-08'}];
  const $ = load(cards(entries, 'news', 3));
  assert.equal($('h3 a').first().attr('href'), 'recent.html');
  assert.equal($('article').length, 3);
  const next = structuredClone(entries); next.find(entry => entry.slug === 'future-event').priority = 100;
  assert.ok(cards(next, 'news', 3).includes('future-event.html'));
  assert.equal(sortEntries([{slug:'a',publishedAt:'2026-01-01'}, {slug:'b',publishedAt:''}])[0].slug, 'a');
});
test('归档保留详情但移出列表，下架内容不会进入列表', () => {
  const entries = readEntries().map(entry => ({ ...entry, visibility: 'archived' }));
  assert.equal(cards(entries, 'news'), ''); assert.ok(article(entries[0]).includes('event-report-title'));
  assert.equal(cards(entries.map(entry => ({ ...entry, visibility: 'hidden' })), 'event'), '');
});
test('正文移除脚本、事件处理器和危险链接，保留图片图注', () => {
  const html = renderBody('<script>alert(1)</script><img src="/assets/a.jpg" onerror="alert(1)"><a href="javascript:alert(1)">link</a><figure class="news-article-figure"><figcaption>Caption</figcaption></figure>');
  assert.ok(!html.includes('<script')); assert.ok(!html.includes('onerror')); assert.ok(!html.includes('javascript:')); assert.ok(html.includes('<figcaption>Caption</figcaption>'));
});
test('拒绝不完整翻译、未来发布日期、冲突文件名和非法路径', () => {
  const original = readEntries()[0];
  for (const mutate of [entry => entry.zh.title = '', entry => entry.publishedAt = '2999-01-01', entry => entry.cover = '/assets/../package.json', entry => entry.slug = '../../x']) {
    const entry = structuredClone(original); mutate(entry); assert.throws(() => validateEntry(entry, original.slug+'.json'));
  }
});
