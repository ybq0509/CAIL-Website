# CAIL 网站与新闻管理后台

## 使用与部署

服务器交接入口：[完整使用、服务器部署与 Codex 交接说明](docs/CMS.md)。CMS 改造交接分支为 `cms-news-admin`，正式站点仍用 `main`；先按说明配置 OAuth 和 Pages 发布方式，再合并上线，不要用源码根目录直接替换成品网站。

网站通过 Eleventy 从三语内容生成静态页面，新闻通过 Decap CMS 管理。浏览网站不依赖数据库；线上编辑需要单独的 GitHub OAuth 认证服务。

本机使用：安装 Node.js 22 后运行 `npm ci`，再运行 `npm run dev:cms`，打开 http://localhost:8767/admin/。本机编辑直接保存本地内容，不会自动提交或推送 Git。详细说明见 [docs/CMS.md](docs/CMS.md)。

运行 `npm run check` 检查并生成 `_site/`。仅将 `_site/` 发布到静态网站服务器。GitHub Pages 使用 `.github/workflows/pages.yml`；首次上线需把仓库 Pages 的发布源设为 GitHub Actions，保留自定义域名。

## 包内结构

- `content/news/`：新闻与活动的三语内容。
- `src/`：首页、列表和新闻详情模板。原网址仍被生成。
- `admin/`：新闻管理面板与编辑器。
- `auth/`：之后部署到已有服务器的 OAuth 服务，不含真实密钥。
- 根目录 HTML：团队、研究、研究成果等尚未接入 CMS 的页面。
- `assets/`：页面实际引用的图片、标志、字体、样式与交互脚本；包含必要的字体许可文件。
- `_site/assets/search-data.js`：构建时自动生成的全站搜索数据。
- `PAGE-MAP.md`：完整页面目录。

英文、简体中文、繁体中文共用同一组 HTML，页面中的语言属性保存对应文字。新闻和活动介绍限制为三行，详情页保留完整正文。论文图片按原比例展示，无图论文不保留空图片位。

英文正文及常规标题使用包内 Muli，学校名称使用 Futura，装饰性斜体保留衬线字体；中文采用系统黑体。

## 后续维护

新闻更新通过 `/admin/` 或 `content/news/*.json` 维护英文、简体和繁体内容。首页、新闻列表、详情页和搜索会自动同步生成。其他页面仍按原方式维护 HTML。请勿直接修改 `_site/`，下次构建会覆盖生成文件。

中心邮箱：siruihan@ust.hk。办公室：Room 4366, Hong Kong University of Science and Technology, Clear Water Bay, Kowloon, Hong Kong。研究方向的团队归属尚未填充，其占位区域及入口已从交付页面移除。学生占位同样不包含在交付页面。

历史新闻正文和图片已迁入内容文件。网页日期无法完全确认的条目会在后台提示核对，勿把未来活动日期误当新闻发布日期。验证命令和服务器部署步骤见 docs/CMS.md。
