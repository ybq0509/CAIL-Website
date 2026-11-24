(() => {
  const root = document.documentElement;
  function sync() {
    const locale = root.lang === 'zh-CN' ? 'zh' : root.lang === 'zh-Hant' ? 'zhHant' : 'en';
    document.querySelectorAll('[data-news-language]').forEach(node => { node.hidden = node.dataset.newsLanguage !== locale; });
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['lang'] });
  sync();
})();
