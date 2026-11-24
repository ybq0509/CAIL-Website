import fs from 'node:fs';
import path from 'node:path';
import { readEntries } from './lib/news.mjs';
import { cmsConfig } from './lib/cms-config.mjs';
import { load } from 'cheerio';
import sharp from 'sharp';

export default function(config) {
  const readSettings = () => JSON.parse(fs.readFileSync('content/settings.json', 'utf8'));
  const settings = readSettings();
  readEntries();
  if (!/^https:\/\/[^/]+$/.test(settings.siteUrl) || settings.repo !== 'ybq0509/CAIL-Website' || settings.branch !== 'main') throw new Error('站点地址或发布仓库配置无效');
  if (settings.authUrl) { const url = new URL(settings.authUrl); if (url.protocol !== 'https:' || url.search || url.hash || url.username || url.password) throw new Error('认证服务地址必须使用 HTTPS，不带查询参数'); }
  for (const key of ['homepageNewsCount', 'homepageEventsCount']) if (!Number.isInteger(settings[key]) || settings[key] < 1 || settings[key] > 12) throw new Error(`${key} must be 1–12`);
  config.addGlobalData('newsEntries', () => readEntries());
  config.addGlobalData('siteSettings', readSettings);
  config.addPassthroughCopy('assets');
  config.addPassthroughCopy('CNAME');
  config.addPassthroughCopy('.nojekyll');
  config.addPassthroughCopy({ 'admin': 'admin' });
  config.addPassthroughCopy({ 'node_modules/markdown-it/dist/markdown-it.min.js': 'admin/vendor/markdown-it.min.js' });
  config.addPassthroughCopy({ 'node_modules/dompurify/dist/purify.min.js': 'admin/vendor/purify.min.js' });
  const legacy = JSON.parse(fs.readFileSync('content/legacy-routes.json', 'utf8'));
  for (const file of fs.readdirSync('.').filter(file => file.endsWith('.html') && !['index.html', 'events.html', ...legacy.map(slug => slug + '.html')].includes(file))) config.addPassthroughCopy(file);
  config.addWatchTarget('content/');
  config.addWatchTarget('lib/');
  config.addWatchTarget('admin/');
  config.on('eleventy.after', async () => {
    const entries = readEntries();
    const settings = readSettings();
    const output = '_site';
    // Watch mode must remove pages that were deleted or hidden after a previous build.
    const activeRoutes = new Set(entries.filter(entry => entry.visibility !== 'hidden').map(entry => entry.slug + '.html'));
    const previousIndex = path.join(output, 'admin/content-index.json');
    const previousSlugs = fs.existsSync(previousIndex) ? JSON.parse(fs.readFileSync(previousIndex, 'utf8')).map(entry => entry.slug) : [];
    for (const slug of new Set([...legacy, ...previousSlugs])) {
      if (!activeRoutes.has(slug + '.html')) fs.rmSync(path.join(output, slug + '.html'), { force: true });
    }
    const uploads = 'assets/news/uploads';
    if (fs.existsSync(uploads)) {
      for (const file of fs.readdirSync(uploads)) {
        if (file.startsWith('.')) continue;
        const input = path.join(uploads, file);
        if (!/\.(jpe?g|png|webp)$/i.test(file) || fs.statSync(input).size > 10 * 1024 * 1024) throw new Error(`上传图片仅支持 JPG/PNG/WebP，大小不超过 10 MB：${file}`);
        let image = sharp(input).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true });
        image = /\.png$/i.test(file) ? image.png({ compressionLevel: 9, palette: true, quality: 90 }) : /\.webp$/i.test(file) ? image.webp({ quality: 84 }) : image.jpeg({ quality: 84, mozjpeg: true });
        await image.toFile(path.join(output, uploads, file));
      }
    }
    const local = process.env.CAIL_LOCAL_CMS === '1';
    fs.writeFileSync(path.join(output, 'admin/runtime.json'), JSON.stringify({ settings, local, cms: cmsConfig(settings, local) }));
    fs.writeFileSync(path.join(output, 'admin/content-index.json'), JSON.stringify(entries.filter(entry => entry.visibility !== 'hidden').map(({ body, zh, zhHant, ...entry }) => ({ ...entry, zh: { title: zh.title }, zhHant: { title: zhHant.title } }))));
    fs.writeFileSync(path.join(output, 'site-version.json'), JSON.stringify({ commit: process.env.GITHUB_SHA || 'local', builtAt: new Date().toISOString() }));
    const records = [];
    for (const name of fs.readdirSync(output).filter(name => name.endsWith('.html'))) {
      const $ = load(fs.readFileSync(path.join(output, name), 'utf8'));
      const heading = $('h1 [data-en]').first().length ? $('h1 [data-en]').first() : $('h1').first();
      const text = $('main').text().replace(/\s+/g, ' ').trim();
      const translations = $('main [data-en]').toArray().flatMap(node => [$(node).attr('data-zh') || '', $(node).attr('data-zh-hant') || '']);
      records.push({ url: name, en: heading.attr('data-en') || heading.text(), zh: heading.attr('data-zh') || heading.text(), zhHant: heading.attr('data-zh-hant') || heading.text(), description: text + ' ' + translations.join(' ') });
    }
    fs.writeFileSync(path.join(output, 'assets/search-data.js'), 'window.CAIL_SEARCH = ' + JSON.stringify(records) + ';\n');
    fs.writeFileSync(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + records.map(record => `<url><loc>${settings.siteUrl}/${record.url}</loc></url>`).join('') + '</urlset>');
    fs.writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nDisallow: /admin/\nSitemap: ${settings.siteUrl}/sitemap.xml\n`);
  });
  return { dir: { input: 'src', output: '_site' }, templateFormats: ['11ty.js'], htmlTemplateEngine: false };
}
