(() => {
  const root=document.documentElement;
  let language=root.lang==='zh-Hant'?'zh-Hant':root.lang==='zh-CN'?'zh':'en';
  const traditionalMap={"响": "響", "变": "變", "审": "審", "绕": "繞", "与": "與", "践": "踐", "担": "擔", "样": "樣", "邮": "郵", "辅": "輔", "侧": "側", "台": "臺", "适": "適", "咨": "諮", "导": "導", "么": "麼", "预": "預", "讲": "講", "资": "資", "记": "記", "论": "論", "据": "據", "断": "斷", "园": "園", "严": "嚴", "争": "爭", "区": "區", "机": "機", "赖": "賴", "迈": "邁", "风": "風", "体": "體", "项": "項", "让": "讓", "盖": "蓋", "环": "環", "顾": "顧", "试": "試", "页": "頁", "叠": "疊", "种": "種", "战": "戰", "语": "語", "团": "團", "经": "經", "览": "覽", "规": "規", "险": "險", "开": "開", "将": "將", "后": "後", "划": "劃", "访": "訪", "认": "認", "讨": "討", "办": "辦", "监": "監", "证": "證", "户": "戶", "轮": "輪", "湾": "灣", "击": "擊", "专": "專", "评": "評", "协": "協", "们": "們", "对": "對", "间": "間", "询": "詢", "个": "個", "过": "過", "动": "動", "浏": "瀏", "网": "網", "结": "結", "续": "續", "顶": "頂", "构": "構", "伙": "夥", "门": "門", "类": "類", "验": "驗", "决": "決", "义": "義", "检": "檢", "链": "鏈", "状": "狀", "数": "數", "连": "連", "学": "學", "为": "爲", "应": "應", "这": "這", "测": "測", "师": "師", "独": "獨", "负": "負", "踪": "蹤", "员": "員", "确": "確", "汇": "匯", "栏": "欄", "标": "標", "说": "說", "韩": "韓", "图": "圖", "议": "議", "够": "夠", "阶": "階", "务": "務", "选": "選", "围": "圍", "内": "內", "问": "問", "进": "進", "单": "單", "群": "羣", "发": "發", "请": "請", "没": "沒", "联": "聯", "见": "見", "录": "錄", "时": "時", "准": "準", "于": "於", "齐": "齊", "绪": "緒", "领": "領", "层": "層", "设": "設", "参": "參", "坛": "壇", "题": "題", "称": "稱", "闻": "聞", "详": "詳", "计": "計", "码": "碼", "术": "術", "场": "場", "绍": "紹", "点": "點", "灯": "燈", "书": "書", "视": "視", "处": "處", "历": "歷", "责": "責", "实": "實", "转": "轉", "关": "關", "并": "並", "简": "簡", "蓝": "藍", "属": "屬", "质": "質", "养": "養", "来": "來", "杂": "雜", "拟": "擬", "占": "佔", "复": "復", "队": "隊", "暂": "暫", "换": "換", "筛": "篩", "报": "報", "习": "習", "会": "會", "业": "業", "态": "態", "闭": "閉", "统": "統", "职": "職", "举": "舉"};
  const traditional=s=>[...s].map(c=>traditionalMap[c]||c).join('');
  const text=(en,zh)=>language==='en'?en:language==='zh-Hant'?traditional(zh):zh;
  const records=window.CAIL_SEARCH||[];
  const search=document.getElementById('site-search');
  const results=document.getElementById('search-results');
  const panel=document.getElementById('search-panel');
  const searchToggle=document.getElementById('search-toggle');
  const menuToggle=document.getElementById('menu-toggle');
  const nav=document.getElementById('primary-nav');
  const filterForm=document.getElementById('event-filters');
  const header=document.querySelector('.header');
  if(document.body.classList.contains('home-page')){
    let ticking=false;
    const syncHeader=()=>{header.classList.toggle('is-scrolled',window.scrollY>40);ticking=false;};
    syncHeader();window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(syncHeader);ticking=true;}},{passive:true});
    window.addEventListener('pageshow',syncHeader);
  }

  const languageControl=document.querySelector('.language');
  const languageCurrent=document.createElement('button');
  languageCurrent.type='button';
  languageCurrent.className='language-current';
  languageCurrent.setAttribute('aria-expanded','false');
  languageCurrent.setAttribute('aria-controls','language-options');
  const languageOptions=document.createElement('div');
  languageOptions.className='language-options';
  languageOptions.id='language-options';
  while(languageControl.firstChild) languageOptions.append(languageControl.firstChild);
  languageControl.append(languageCurrent,languageOptions);
  const setLanguageOpen=open=>{
    languageControl.classList.toggle('is-open',open);
    languageCurrent.setAttribute('aria-expanded',String(open));
  };
  languageCurrent.addEventListener('click',()=>setLanguageOpen(!languageControl.classList.contains('is-open')));
  languageControl.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover) and (max-width:700px)').matches)setLanguageOpen(true)});
  languageControl.addEventListener('mouseleave',()=>setLanguageOpen(false));
  languageControl.addEventListener('focusout',event=>{if(!languageControl.contains(event.relatedTarget))setLanguageOpen(false)});
  document.addEventListener('click',event=>{if(!languageControl.contains(event.target))setLanguageOpen(false)});
  languageControl.addEventListener('keydown',event=>{if(event.key==='Escape'){setLanguageOpen(false);languageCurrent.focus()}});

  function translate(lang){
    languageCurrent.textContent=lang==='en'?'EN':lang==='zh'?'简体':'繁體';
    languageCurrent.setAttribute('aria-label',lang==='en'?'Change language':lang==='zh'?'切换语言':'切換語言');
    setLanguageOpen(false);
    language=lang;root.lang=lang==='zh-Hant'?'zh-Hant':lang==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(el=>el.textContent=el.getAttribute('data-'+lang.toLowerCase())||el.dataset.en);
    document.querySelectorAll('[data-en-placeholder]').forEach(el=>el.placeholder=el.getAttribute('data-'+lang.toLowerCase()+'-placeholder')||el.dataset.enPlaceholder);
    document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===lang)));
    const mainTitle=document.querySelector('h1'); if(mainTitle)document.title=(location.pathname.endsWith('index.html')?text('Home','首页'):mainTitle.textContent)+' | CAIL · HKUST';
    document.querySelectorAll('.sub-toggle').forEach(button=>{const label=button.closest('.nav-top').querySelector('a').textContent;button.setAttribute('aria-label',text('Open '+label+' submenu','展开'+label+'子菜单'));});
    searchToggle.setAttribute('aria-label',text('Search site','搜索网站'));
    document.getElementById('search-close').setAttribute('aria-label',text('Close search','关闭搜索'));
    menuToggle.setAttribute('aria-label',nav.classList.contains('is-open')?text('Close navigation','关闭导航'):text('Open navigation','打开导航'));
    search.setAttribute('aria-label',text('Search research, people and publications','搜索研究、团队和成果'));
    try{localStorage.setItem('cail-language',lang)}catch(e){}
    renderSearch();applyLocalSearch();document.querySelectorAll('.select-control').forEach(el=>el.syncSelection?.());
  }
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>translate(button.dataset.language)));
  function renderSearch(){
    const q=search.value.trim().toLowerCase();results.replaceChildren();
    const matching=records.filter(r=>(r.en+' '+r.zh+' '+(r.zhHant||'')+' '+r.description).toLowerCase().includes(q)).slice(0,q?20:6);
    if(!matching.length){const p=document.createElement('p');p.textContent=text('No pages found. Try “research”, “Sirui Han” or “LexiHK”.','未找到相关页面。试试“研究”“韩斯睿”或“LexiHK”。');results.append(p);return}
    if(!q){const p=document.createElement('p');p.textContent=text('Explore CAIL','浏览 CAIL');results.append(p)}
    matching.forEach(r=>{const a=document.createElement('a');a.href=r.url;a.className='search-result';const span=document.createElement('span');span.textContent=language==='zh-Hant'?(r.zhHant||traditional(r.zh)):r[language];const i=document.createElement('span');i.className='icon';i.setAttribute('aria-hidden','true');i.textContent='arrow_forward';a.append(span,i);results.append(a)});
  }
  function toggleSearch(open){panel.hidden=!open;searchToggle.setAttribute('aria-expanded',String(open));if(open){closeMenu();search.focus();renderSearch()}else searchToggle.focus()}
  searchToggle.addEventListener('click',()=>toggleSearch(panel.hidden));
  document.getElementById('search-close').addEventListener('click',()=>toggleSearch(false));
  search.addEventListener('input',renderSearch);
  function closeMenu(){nav.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label',text('Open navigation','打开导航'));menuToggle.querySelector('.icon').textContent='menu'}
  menuToggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?text('Close navigation','关闭导航'):text('Open navigation','打开导航'));menuToggle.querySelector('.icon').textContent=open?'close':'menu';panel.hidden=true;searchToggle.setAttribute('aria-expanded','false')});
  document.querySelectorAll('.sub-toggle').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.nav-item');const open=!item.classList.contains('open');item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}));
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!panel.hidden)toggleSearch(false);if(nav.classList.contains('is-open')){closeMenu();menuToggle.focus()}document.querySelectorAll('.nav-item.open').forEach(el=>{el.classList.remove('open');el.querySelector('.sub-toggle').setAttribute('aria-expanded','false')})}});
  document.addEventListener('click',e=>{if(!panel.hidden&&!e.target.closest('.header')){panel.hidden=true;searchToggle.setAttribute('aria-expanded','false')}});
  function updateFilters(){
    if(!filterForm)return;
    applyLocalSearch();
  }
  function applyLocalSearch(){
    const input=document.querySelector('[data-section-search]');
    if(!input)return;
    const selectors={research:'.platform-item,.project-feature,.content-project',people:'.cail-person',events:'.event-placeholder,.news-card,.home-news-card',publications:'.publication'};
    const q=input.value.trim().toLocaleLowerCase();
    const criteria=filterForm?new FormData(filterForm):null;
    const type=String(criteria?.get('type')||'').toLowerCase();
    const year=criteria?.get('year')||'';
    const cards=[...document.querySelectorAll(selectors[input.dataset.sectionSearch])];
    cards.forEach(card=>{
      const content=[card.textContent,...[...card.querySelectorAll('[data-en]')].flatMap(x=>[x.dataset.en,x.dataset.zh,x.dataset.zhHant])].join(' ').toLocaleLowerCase();
      const upcoming=!!card.closest('#upcoming');
      const match=(!q||content.includes(q))&&(!upcoming||((!type||card.dataset.placeholderType===type)&&(!year||card.dataset.year===year)));
      card.hidden=!match;
    });
    const count=document.getElementById('filter-count');
    if(count)count.textContent=text(`${cards.filter(x=>x.matches('#upcoming .event-placeholder')&&!x.hidden).length} events`,`${cards.filter(x=>x.matches('#upcoming .event-placeholder')&&!x.hidden).length} 项活动`);
    let empty=document.getElementById('section-search-empty');
    if(!empty){empty=document.createElement('p');empty.id='section-search-empty';empty.setAttribute('role','status');input.closest('.section-search').after(empty);}
    empty.textContent=text('No results found.','没有找到相关内容。');empty.hidden=cards.some(x=>!x.hidden);
  }
  document.querySelector('[data-section-search]')?.addEventListener('input',applyLocalSearch);

  if(filterForm){filterForm.addEventListener('input',updateFilters);filterForm.addEventListener('change',updateFilters);filterForm.addEventListener('submit',e=>e.preventDefault());filterForm.addEventListener('reset',()=>requestAnimationFrame(updateFilters))}
  // A styled listbox replaces only the visual select; native fields retain form values.
  const yearSelect=filterForm?.querySelector('select[name=year]');
  if(yearSelect){
    [...yearSelect.options].filter(o=>o.value).forEach(o=>o.remove());
    const years=[...new Set([...document.querySelectorAll('#upcoming .event-placeholder[data-year]')].map(c=>c.dataset.year))].sort().reverse();
    years.forEach(year=>yearSelect.add(new Option(year,year)));
  }
  const dropdowns=[];
  if(filterForm)filterForm.querySelectorAll('select').forEach(select=>{
    const originalLabel=select.closest('label');
    const label=originalLabel.querySelector('span');
    const field=document.createElement('div');field.className='filter-field';
    label.id='filter-'+select.name+'-label';
    originalLabel.replaceWith(field);field.append(label,select);
    select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const control=document.createElement('div');control.className='select-control';field.append(control);
    const trigger=document.createElement('button');trigger.type='button';trigger.className='select-trigger';
    trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    const value=document.createElement('span');value.id='filter-'+select.name+'-value';
    trigger.setAttribute('aria-labelledby',label.id+' '+value.id);
    const chevron=document.createElement('span');chevron.className='icon';chevron.setAttribute('aria-hidden','true');chevron.textContent='expand_more';trigger.append(value,chevron);
    const list=document.createElement('div');list.className='select-options';list.id='filter-'+select.name+'-options';list.setAttribute('role','listbox');list.setAttribute('aria-labelledby',label.id);list.hidden=true;
    trigger.setAttribute('aria-controls',list.id);control.append(trigger,list);
    let active=select.selectedIndex;
    const options=[...select.options].map((source,index)=>{
      const option=document.createElement('div');option.className='select-option';option.id=list.id+'-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');
      const title=document.createElement('span');title.textContent=source.textContent;if(source.dataset.en){title.dataset.en=source.dataset.en;title.dataset.zh=source.dataset.zh;title.dataset.zhHant=source.dataset.zhHant}
      const check=document.createElement('span');check.className='icon';check.setAttribute('aria-hidden','true');check.textContent='check';option.append(title,check);list.append(option);
      option.addEventListener('pointerdown',e=>e.preventDefault());
      option.addEventListener('click',()=>choose(index));
      option.addEventListener('pointermove',()=>highlight(index));
      return option;
    });
    function highlight(index){active=index;options.forEach((o,i)=>o.classList.toggle('is-highlighted',i===index));trigger.setAttribute('aria-activedescendant',options[index].id)}
    function sync(){value.textContent=select.options[select.selectedIndex].textContent;options.forEach((o,i)=>{const selected=i===select.selectedIndex;o.setAttribute('aria-selected',String(selected));o.querySelector('.icon').style.visibility=selected?'visible':'hidden'})}
    function close(){list.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');options.forEach(o=>o.classList.remove('is-highlighted'))}
    function open(){dropdowns.forEach(d=>d.close());list.hidden=false;trigger.setAttribute('aria-expanded','true');highlight(select.selectedIndex)}
    function choose(index){select.selectedIndex=index;sync();close();select.dispatchEvent(new Event('change',{bubbles:true}));trigger.focus()}
    trigger.addEventListener('click',()=>list.hidden?open():close());
    trigger.addEventListener('keydown',e=>{
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const wasClosed=list.hidden;if(wasClosed)open();if(e.key==='Home')highlight(0);else if(e.key==='End')highlight(options.length-1);else if(!wasClosed)highlight((active+(e.key==='ArrowDown'?1:-1)+options.length)%options.length)}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(list.hidden)open();else choose(active)}
      else if(e.key==='Escape'){e.preventDefault();close()}
      else if(e.key==='Tab')close();
      else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){const found=options.findIndex(o=>o.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));if(found>=0){e.preventDefault();if(list.hidden)open();highlight(found)}}
    });
    control.syncSelection=sync;dropdowns.push({close,control});select.addEventListener('change',sync);sync();
  });
  document.addEventListener('pointerdown',e=>dropdowns.forEach(d=>{if(!d.control.contains(e.target))d.close()}));
  filterForm?.addEventListener('reset',()=>requestAnimationFrame(()=>dropdowns.forEach(d=>{d.close();d.control.syncSelection()})));
  const tocLinks=[...document.querySelectorAll('.page-toc a')];
  if('IntersectionObserver' in window&&tocLinks.length){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)tocLinks.forEach(a=>{const active=a.hash==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})})},{rootMargin:'-130px 0px -55% 0px',threshold:0});document.querySelectorAll('.content-section').forEach(s=>observer.observe(s))}
  translate(language);
})();

