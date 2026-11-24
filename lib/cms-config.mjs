const languageFields = suffix => [
  { label: '标题' + suffix, name: 'title', widget: 'string' },
  { label: '摘要（用于首页和列表）', name: 'summary', widget: 'text', hint: '建议 1–3 句话，详情页保留完整正文。' },
  { label: '正文', name: 'body', widget: 'markdown', editor_components: ['cail-image'], buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'quote', 'bulleted-list', 'numbered-list'], modes: ['rich_text', 'raw'] },
];
export function cmsConfig(settings, local = false) {
  const auth = settings.authUrl ? new URL(settings.authUrl) : null;
  return {
    backend: { name: 'github', repo: settings.repo, branch: settings.branch, ...(auth ? { base_url: auth.origin, auth_endpoint: auth.pathname.replace(/\/$/, '') + '/auth' } : {}), auth_scope: 'public_repo' },
    local_backend: local ? { url: 'http://127.0.0.1:8081/api/v1' } : false,
    publish_mode: 'editorial_workflow', locale: 'zh_Hans',
    site_url: local ? 'http://localhost:8767' : settings.siteUrl, display_url: local ? 'http://localhost:8767' : settings.siteUrl,
    logo_url: '/assets/logos/figma-20261019/header-color.svg',
    media_folder: 'assets/news/uploads', public_folder: '/assets/news/uploads',
    collections: [{
      name: 'news', label: '新闻与活动', label_singular: '文章', folder: 'content/news',
      create: true, extension: 'json', format: 'json', identifier_field: 'slug', slug: '{{slug}}',
      summary: '{{title}} · {{publishedAt}}', sortable_fields: ['publishedAt', 'title', 'section'],
      view_filters: [{ label: '新闻', field: 'section', pattern: 'news' }, { label: '活动', field: 'section', pattern: 'event' }, { label: '待核对日期', field: 'publicationDateNeedsReview', pattern: true }, { label: '已归档', field: 'visibility', pattern: 'archived' }],
      preview_path: '{{slug}}.html',
      fields: [
        { label: '网址标识', name: 'slug', widget: 'string', pattern: ['^[a-z0-9]+(?:-[a-z0-9]+)*$', '使用小写字母、数字和连字符'], hint: '例如 legal-ai-seminar-2026。发布后请勿修改，以免旧网址失效。' },
        { label: '栏目', name: 'section', widget: 'select', options: [{ label: '新闻', value: 'news' }, { label: '活动', value: 'event' }], default: 'news' },
        { label: '分类', name: 'category', widget: 'select', options: [{ label: '活动报道', value: 'event-report' }, { label: '研究动态', value: 'research' }, { label: '媒体报道', value: 'media' }, { label: '奖项', value: 'award' }, { label: '征稿启事', value: 'call-for-papers' }, { label: '通知', value: 'announcement' }], default: 'event-report' },
        { label: '显示状态', name: 'visibility', widget: 'select', options: [{ label: '正常显示', value: 'published' }, { label: '归档（保留网址，从列表移除）', value: 'archived' }, { label: '下架（不生成页面）', value: 'hidden' }], default: 'published' },
        { label: '新闻发布日期', name: 'publishedAt', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, required: false, default: '', hint: '新闻发布的日期，不是活动发生日期。不提供定时发布；未来活动日期填下方。' },
        { label: '活动日期', name: 'eventDate', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, required: false, default: '' },
        { label: '发布日期待核对', name: 'publicationDateNeedsReview', widget: 'boolean', default: false, hint: '历史内容保留了原网页日期，请核对后关闭此开关。' },
        { label: '原网页日期', name: 'legacyDate', widget: 'hidden', required: false, default: '' },
        { label: '允许首页推荐', name: 'featured', widget: 'boolean', default: true },
        { label: '首页优先级', name: 'priority', widget: 'number', value_type: 'int', min: 0, max: 100, default: 0, hint: '数字越大越靠前；相同优先级按新闻发布日期倒序。' },
        { label: '封面图片', name: 'cover', widget: 'image', choose_url: false, media_library: { config: { max_file_size: 10 * 1024 * 1024 } }, hint: '上传 JPG、PNG 或 WebP，单张不超过 10 MB。构建时自动压缩，原图保留。' },
        { label: '封面图片描述', name: 'coverAlt', widget: 'string', hint: '简短描述图片，供屏幕阅读器使用。' },
        ...languageFields('（英文）'),
        { label: '简体中文', name: 'zh', widget: 'object', collapsed: true, fields: languageFields('（简体）') },
        { label: '繁體中文', name: 'zhHant', widget: 'object', collapsed: true, fields: languageFields('（繁體）') },
      ],
    }, {
      name: 'settings', label: '首页显示设置', files: [{ name: 'homepage', label: '首页显示设置', file: 'content/settings.json', fields: [
        ...['siteUrl', 'repo', 'branch', 'authUrl'].map(name => ({ name, widget: 'hidden', required: false })),
        { label: '首页新闻数量', name: 'homepageNewsCount', widget: 'number', value_type: 'int', min: 1, max: 12 },
        { label: '首页活动数量', name: 'homepageEventsCount', widget: 'number', value_type: 'int', min: 1, max: 12 },
      ] }],
    }],
  };
}
