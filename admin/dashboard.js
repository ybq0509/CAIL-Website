(() => {
  const $ = id => document.getElementById(id);
  let entries = [], runtime;
  const text = (tag, content, className) => { const node = document.createElement(tag); node.textContent = content; if (className) node.className = className; return node; };
  function render() {
    const query = $('search').value.trim().toLowerCase();
    const filtered = entries.filter(entry => [entry.title, entry.zh.title, entry.zhHant.title].join(' ').toLowerCase().includes(query) && (!$('section').value || entry.section === $('section').value) && (!$('visibility').value || entry.visibility === $('visibility').value));
    $('articles').replaceChildren();
    for (const entry of filtered) {
      const row = document.createElement('tr');
      const title = document.createElement('td'); title.append(text('p', entry.zh.title || entry.title, 'article-title'), text('p', entry.title, 'article-subtitle'));
      const meta = text('div', '', 'article-meta');
      meta.append(text('span', 'EN / 简 / 繁', 'tag'));
      if (entry.featured) meta.append(text('span', '首页候选 · 优先级 ' + entry.priority, 'tag'));
      if (entry.publicationDateNeedsReview) meta.append(text('span', '日期待核对', 'tag review'));
      title.append(meta); row.append(title, text('td', entry.section === 'news' ? '新闻' : '活动'));
      const date = text('td', entry.publishedAt || '待填写', 'date-cell');
      if (entry.eventDate) date.append(text('small', '活动 ' + entry.eventDate));
      row.append(date, text('td', entry.visibility === 'archived' ? '已归档' : '已发布'));
      const actions = document.createElement('td'); const links = text('div', '', 'actions');
      const edit = text('a', '编辑'); edit.href = 'editor.html#/collections/news/entries/' + entry.slug; edit.dataset.editor = 'entry';
      const view = text('a', '查看'); view.href = '/' + entry.slug + '.html'; view.target = '_blank'; view.rel = 'noopener';
      const history = text('a', '历史'); history.href = 'https://github.com/' + runtime.settings.repo + '/commits/' + runtime.settings.branch + '/content/news/' + entry.slug + '.json'; history.target = '_blank'; history.rel = 'noopener';
      if (runtime.local) { history.textContent = '本地文件'; history.removeAttribute('href'); history.title = '修改记录在之后提交 Git 时保存。'; }
      links.append(edit, view, history); actions.append(links); row.append(actions); $('articles').append(row);
    }
    $('result-count').textContent = filtered.length + ' 篇文章'; $('empty').hidden = filtered.length !== 0;
    if (!runtime.local && !runtime.settings.authUrl) document.querySelectorAll('[data-editor]').forEach(node => { node.setAttribute('aria-disabled', 'true'); node.href = 'setup.html'; });
  }
  async function deployment() {
    $('refresh').disabled = true;
    try {
      const response = await fetch('/site-version.json', { cache: 'no-store' }); if (!response.ok) throw new Error('无法读取版本'); const version = await response.json();
      if (runtime.local) { $('deployment-state').textContent = '本地预览 · 保存后自动重新生成。不会推送 Git，也不会修改正式网站。最近构建：' + new Date(version.builtAt).toLocaleString(); return; }
      $('deployment-state').textContent = '当前站点版本：' + version.commit.slice(0, 7) + '。正在查询最新部署…';
      const responseRuns = await fetch('https://api.github.com/repos/' + runtime.settings.repo + '/actions/runs?branch=' + runtime.settings.branch + '&per_page=5'); if (!responseRuns.ok) throw new Error('GitHub 状态查询暂不可用');
      const data = await responseRuns.json(); const run = data.workflow_runs.find(item => /pages|deploy/i.test(item.name));
      if (!run) throw new Error('暂无部署记录');
      const state = run.status !== 'completed' ? '正在部署，正式站仍显示上一成功版本' : run.conclusion === 'success' && run.head_sha === version.commit ? '已上线' : run.conclusion === 'success' ? '部署完成，等待站点缓存刷新' : '发布失败，请查看构建记录';
      $('deployment-state').textContent = state + ' · 当前站点版本 ' + version.commit.slice(0, 7);
      $('deployment-link').hidden = false; $('deployment-link').href = run.html_url;
    } catch (error) { $('deployment-state').textContent = error.message + '。可到 GitHub Actions 查看。'; } finally { $('refresh').disabled = false; }
  }
  async function init() {
    const [configResponse, entriesResponse] = await Promise.all([fetch('runtime.json', { cache: 'no-store' }), fetch('content-index.json', { cache: 'no-store' })]);
    if (!configResponse.ok || !entriesResponse.ok) throw new Error('请通过 npm run dev:cms 启动后台，不能直接打开源文件。');
    runtime = await configResponse.json(); entries = (await entriesResponse.json()).sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    $('mode-badge').textContent = runtime.local ? '本机编辑模式' : '正式站点'; $('mode-badge').classList.toggle('local', runtime.local);
    if (runtime.local) document.querySelector('.footnote').textContent = '本机编辑会保存到本地文件。之后由你提交 Git 并部署；当前不会修改正式网站。';
    if (runtime.local) { const workflow = document.querySelector('[data-editor="workflow"]'); workflow.textContent = '发布与审核说明'; workflow.href = 'setup.html#workflow'; }
    $('connection').textContent = runtime.local ? '本机模式：编辑直接保存到这个仓库的文件中，保存后预览会更新。当前不启用多人审核，不会推送或发布到正式网站。' : runtime.settings.authUrl ? '已配置 GitHub 登录。进入编辑器后登录；保存草稿后，需在审核流程中批准发布。' : '线上认证尚未配置。内容可查看，编辑入口将在认证服务部署后启用。';
    $('connection').classList.toggle('warning', runtime.local || !runtime.settings.authUrl);
    if (!runtime.local && !runtime.settings.authUrl) { $('create').href = 'setup.html'; $('create').textContent = '配置登录认证'; }
    $('published-count').textContent = entries.filter(entry => entry.visibility === 'published').length;
    $('featured-count').textContent = entries.filter(entry => entry.featured && entry.visibility === 'published').length;
    $('review-count').textContent = entries.filter(entry => entry.publicationDateNeedsReview).length;
    $('archive-count').textContent = entries.filter(entry => entry.visibility === 'archived').length;
    for (const id of ['search', 'section', 'visibility']) $(id).addEventListener('input', render);
    $('refresh').addEventListener('click', deployment); render(); await deployment();
  }
  init().catch(error => { $('connection').textContent = error.message; $('connection').classList.add('warning'); $('create').setAttribute('aria-disabled', 'true'); $('create').removeAttribute('href'); });
})();
