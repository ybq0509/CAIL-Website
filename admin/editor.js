(async () => {
  const message = document.getElementById('editor-message');
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  try {
    const response = await fetch('runtime.json', { cache: 'no-store' }); if (!response.ok) throw new Error('请先启动本地预览。');
    const runtime = await response.json();
    const local = runtime.local && ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!local && !runtime.settings.authUrl) {
      message.replaceChildren(); const title = document.createElement('h1'); title.textContent = '尚未配置线上登录'; const info = document.createElement('p'); info.textContent = '本机可通过 npm run dev:cms 使用编辑器。上线前请先部署认证服务，并配置认证地址。'; const link = document.createElement('a'); link.href = 'setup.html'; link.textContent = '查看配置说明'; message.append(title, info, link); return;
    }
    const CMS = window.CMS, h = window.h, createClass = window.createClass;
    CMS.registerPreviewStyle('/assets/site.css'); CMS.registerPreviewStyle('/assets/refinements.css'); CMS.registerPreviewStyle('/assets/typography.css'); CMS.registerPreviewStyle('/assets/news-content.css');
    CMS.registerPreviewStyle('body { background:white; } .cms-preview { padding:24px; } .cms-preview .event-report{padding:0;max-width:100%;} .cms-preview nav{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap} .cms-preview button{padding:8px 12px;border:1px solid #ccd5e1;background:white;cursor:pointer} .cms-preview .preview-card{max-width:420px;margin-top:32px;border:1px solid #ddd;padding:16px;} .cms-preview img{max-width:100%;height:auto;}', { raw: true });
    CMS.registerEditorComponent({
      id: 'cail-image', label: '图片与图注',
      fields: [{ name: 'image', label: '图片', widget: 'image', choose_url: false, media_library: { config: { max_file_size: 10 * 1024 * 1024 } } }, { name: 'alt', label: '图片描述', widget: 'string' }, { name: 'caption', label: '图注', widget: 'text', required: false }, { name: 'poster', label: '海报（限制显示宽度）', widget: 'boolean', default: false }],
      pattern: /^<figure class="news-article-figure( is-poster)?"><img src="([^"]*)" alt="([^"]*)"\/?>(?:<figcaption>(.*?)<\/figcaption>)?<\/figure>$/,
      fromBlock: match => { const decode = value => { const area = document.createElement('textarea'); area.innerHTML = value || ''; return area.value; }; return { poster: !!match[1], image: decode(match[2]), alt: decode(match[3]), caption: decode(match[4]) }; },
      toBlock: data => `<figure class="news-article-figure${data.poster ? ' is-poster' : ''}"><img src="${escape(data.image)}" alt="${escape(data.alt)}"/>${data.caption ? '<figcaption>' + escape(data.caption) + '</figcaption>' : ''}</figure>`,
      toPreview: data => h('figure', { className: 'news-article-figure' + (data.poster ? ' is-poster' : '') }, h('img', { src: data.image, alt: data.alt }), data.caption ? h('figcaption', {}, data.caption) : null),
    });
    const Preview = createClass({
      getInitialState() { return { locale: 'en' }; },
      render() {
        const data = this.props.entry.get('data').toJS(), locale = this.state.locale, value = locale === 'en' ? data : data[locale] || {};
        const container = document.createElement('div');
        container.innerHTML = window.DOMPurify.sanitize(window.markdownit({ html: true }).render(value.body || ''), { ADD_TAGS: ['figure', 'figcaption'], FORBID_ATTR: ['style'] });
        container.querySelectorAll('img').forEach(image => { image.src = this.props.getAsset(image.getAttribute('src')).toString(); });
        const html = container.innerHTML;
        const cover = data.cover ? this.props.getAsset(data.cover).toString() : '';
        return h('div', { className: 'cms-preview' }, h('nav', {}, ...[['en', 'English'], ['zh', '简体中文'], ['zhHant', '繁體中文']].map(([key, label]) => h('button', { key, type: 'button', onClick: () => this.setState({ locale: key }), 'aria-pressed': locale === key }, label))), h('h1', {}, value.title || '请填写标题'), h('p', {}, [data.publishedAt || '发布日期待填写', data.eventDate ? '活动 ' + data.eventDate : ''].filter(Boolean).join(' · ')), h('article', { className: 'event-report' }, h('p', { className: 'event-report-lead' }, value.summary || ''), h('div', { dangerouslySetInnerHTML: { __html: html } })), h('div', { className: 'preview-card' }, h('p', {}, '首页／列表卡片预览'), cover ? h('img', { src: cover, alt: data.coverAlt || '' }) : null, h('h3', {}, value.title || ''), h('p', {}, value.summary || '')));
      },
    });
    CMS.registerPreviewTemplate('news', Preview);
    CMS.registerEventListener({ name: 'preSave', handler: ({ entry }) => {
      if (entry.get('collection') !== 'news') return;
      const data = entry.get('data');
      const slug = data.get('slug');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || ['index', 'events', 'admin', '404'].includes(slug)) throw new Error('网址标识无效或与网站页面冲突。');
      if (entry.get('slug') && entry.get('slug') !== slug) throw new Error('已保存文章的网址标识不能更改。请复制为新文章。');
      const images = [data.get('cover'), ...['body', 'zh', 'zhHant'].flatMap(locale => {
        const text = locale === 'body' ? data.get('body') : data.getIn([locale, 'body']);
        return [...String(text || '').matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
      })];
      if (images.some(image => !/^\/?assets\//.test(image) || String(image).includes('..'))) throw new Error('请选择媒体库中的图片，不支持站外图片或非法路径。');
      if (images.some(image => String(image).includes('/uploads/') && !/\.(jpe?g|png|webp)$/i.test(image))) throw new Error('新上传图片仅支持 JPG、PNG 或 WebP。');
      const date = data.get('publishedAt');
      if (!date && !(data.get('legacyDate') && data.get('publicationDateNeedsReview'))) throw new Error('请填写新闻发布日期；未来活动日期请填入活动日期栏。');
      if (date && String(date).slice(0, 10) > new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(new Date())) throw new Error('新闻发布日期不能在未来。');
      for (const locale of ['zh', 'zhHant']) for (const field of ['title', 'summary', 'body']) if (!data.getIn([locale, field])?.trim()) throw new Error(`请补齐 ${locale} 的 ${field}。`);
    } });
    if (local) runtime.cms.publish_mode = 'simple';
    message.hidden = true;
    CMS.init({ config: runtime.cms, load_config_file: false });
  } catch (error) { message.hidden = false; message.textContent = '编辑器启动失败：' + error.message; }
})();
