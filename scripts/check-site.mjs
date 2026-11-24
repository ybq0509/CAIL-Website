import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { readEntries } from '../lib/news.mjs';
const entries = readEntries();
for (const entry of entries) {
  const file = path.join('_site', entry.slug + '.html');
  if (entry.visibility === 'hidden') { if (fs.existsSync(file)) throw new Error('下架文章仍被生成：' + file); continue; }
  if (!fs.existsSync(file)) throw new Error('缺少文章页面：' + file);
  const $ = load(fs.readFileSync(file, 'utf8'));
  if ($('[data-news-language]').length !== 3) throw new Error('缺少三语正文：' + file);
}
for (const file of fs.readdirSync('_site').filter(file => file.endsWith('.html'))) {
  const $ = load(fs.readFileSync(path.join('_site', file), 'utf8'));
  $('a[href],img[src],script[src],link[rel="stylesheet"]').each((_, node) => {
    const target = $(node).attr('href') || $(node).attr('src');
    if (!target || /^(https?:|mailto:|tel:|#)/.test(target)) return;
    const clean = decodeURI(target.split(/[?#]/)[0]).replace(/^\//, '');
    if (clean && !fs.existsSync(path.join('_site', clean))) throw new Error(`${file} 引用了不存在的文件：${target}`);
  });
}
for (const file of ['content/settings.json', 'auth/server.mjs', 'package-lock.json', 'node_modules']) if (fs.existsSync(path.join('_site', file))) throw new Error('构建包含非发布文件：' + file);
if (fs.readFileSync('_site/CNAME', 'utf8').trim() !== 'cail.hkust.edu.hk') throw new Error('自定义域名配置丢失');
console.log(`站点检查通过：${entries.length} 篇文章、三语正文、站内链接、发布目录和域名。`);
