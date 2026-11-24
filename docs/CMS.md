# CAIL 新闻后台：使用、服务器部署与 Codex 交接

更新日期：2026-11-25（香港／北京时间）。这是服务器部署的完整交接入口，请先通读再执行。

## 1. 项目身份与交接状态

| 项目 | 确定信息 |
| --- | --- |
| 仓库 | https://github.com/ybq0509/CAIL-Website |
| CMS 交接分支 | `cms-news-admin` |
| 交接代码 | https://github.com/ybq0509/CAIL-Website/tree/cms-news-admin |
| 本文在线地址 | https://github.com/ybq0509/CAIL-Website/blob/cms-news-admin/docs/CMS.md |
| 生产分支 | `main`；不要未经检查覆盖 |
| 正式网站 | https://cail.hkust.edu.hk/ |
| 目标后台地址 | https://cail.hkust.edu.hk/admin/ |
| 发布记录 | https://github.com/ybq0509/CAIL-Website/actions |
| Pages 设置 | https://github.com/ybq0509/CAIL-Website/settings/pages |
| Mac 实际 Git 工作目录 | `/Users/yinboqin/Desktop/CAIL-Website/CAIL-Website-deploy` |
| 改造前基准提交 | `256d63b`，已包含此前新增论文 |

交接分支上的代码不是已上线服务。推送该分支不会触发本项目仅监听 main 的生产发布工作流；接手时须再次核对分支 SHA、生产版本和实际服务器状态。

已实现：新闻／活动管理面板、Decap 图文编辑器、英文／简体／繁体预览、图片上传与压缩、首页推荐排序、归档和下架、搜索／站点地图生成、Pages 发布工作流、独立 OAuth 服务。

本机已验证：迁移 8 篇历史内容，保留原网址、三语正文和图注；编辑、复制、保存、图片上传、首页／搜索同步、删除文章后的预览清理。10 项自动测试以及站内链接、发布目录、域名检查通过。临时测试内容已清理，论文、团队、研究和 CNAME 输出保持原样。

尚未完成：真实 GitHub OAuth 登录、服务器部署、反向代理与证书验收、线上审核发布全流程、Pages 发布源切换。初始 `content/settings.json` 的 `authUrl` 为空，生产编辑器因此不会开放登录。不得因为代码已推送就报告“后台已上线”。

## 2. 部署架构：官网不搬家

```text
读者 → cail.hkust.edu.hk → GitHub Pages 静态网站
编辑者 → 官网 /admin/ → GitHub 登录 → 自有服务器 OAuth 服务
编辑者保存内容 → GitHub 草稿分支／PR → 合并 main
main → GitHub Actions 检查和构建 → 发布 _site → 官网更新
```

- 自有服务器长期运行的只有 `auth/server.mjs`，负责 OAuth 授权和仓库写权限核验，不托管新闻或数据库。
- 管理页面也是静态文件，随官网发布到 Pages。无需在服务器另启一个前端 Web 应用。
- `cail.hkust.edu.hk` 现有 DNS 继续指向 GitHub Pages。认证使用服务器另一个现有 HTTPS 域名及 `/cail-cms-auth` 路径，不擅自改学校 DNS。
- 生产不要运行 `npm run dev:cms` 或 decap-server，不对外开放 8081、8767、8787。本地文件代理没有生产身份认证。
- 没有可用的认证 HTTPS 域名时，请负责人确认域名和证书方案，不要自行改成公网 HTTP 或关闭证书检查。

## 3. 给服务器 Codex 的执行要求

目标是部署已有 OAuth 服务并打通官网编辑发布，不是重做后台，也不是把官网迁入服务器。

1. 先检查 OS、权限、Node 路径及版本、现有反向代理、HTTPS 域名／证书、端口和同名服务，以及工作副本是否有未提交修改。
2. 从 `cms-news-admin` 接手，先测试并记录 SHA。禁止强推、`reset --hard`、盲目覆盖目录或整份 Nginx 配置。
3. 修改服务器配置前备份确切文件；使用非 root 服务账号，复用现有反向代理。不要影响其他站点。
4. Secret 仅保存在服务器受保护文件中，不进 Git、前端、截图、日志或报告。需要负责人登录或配置凭据时明确交接，不索要密码或私钥。
5. 先完成认证服务及构建检查。变更 Pages 发布源、合并 main 和正式上线前，列明变更及回退方式，请负责人确认时间窗口。
6. 必须完成第 11 节真实验收；需要用户操作的项目明确列出，不将本机测试当成线上成功。

接手后还需负责人提供／确认：服务器访问及部署约束、认证 HTTPS 域名、OAuth Client ID／Secret 的安全配置、允许编辑的 GitHub 账号、仓库管理权限及上线时间。本文件没有 SSH 地址或真实凭据。

## 4. 获取代码和本机使用

在服务器专用的可写代码目录执行，不照抄 Mac 路径：

```sh
git clone --branch cms-news-admin --single-branch https://github.com/ybq0509/CAIL-Website.git CAIL-Website-cms
cd CAIL-Website-cms
git status --short
git log -1 --format='%H %s'
node --version
npm ci
npm run check
```

需要 Node.js 22 或更新兼容版本，按 package-lock.json 安装，不必升级依赖。已有工作副本须先检查远程及本地修改再 fetch／切分支，不在已有项目内盲目 clone。

Mac 本机试用：

```sh
cd "/Users/yinboqin/Desktop/CAIL-Website/CAIL-Website-deploy"
npm ci
npm run dev:cms
```

入口：[管理总览](http://localhost:8767/admin/)、[编辑器](http://localhost:8767/admin/editor.html)、[网站预览](http://localhost:8767/)。已有服务运行时不要再启动第二份。

编辑器若显示“登录”直接点击，本机无需 GitHub 账号。本地代理监听 `127.0.0.1:8081`，仅接受 `http://localhost:8767` 的请求，请使用 localhost 地址。Ctrl+C 停止两个进程。

本机“发布”只保存本地文件，不提交、不推送、不更新官网，也没有多人审批。`npm run check` 会生成生产模式输出，完成后重新启动 `npm run dev:cms` 继续本机编辑。

## 5. 日常内容维护

### 新增、编辑和复制

1. 管理后台点“新增文章”或列表“编辑”。填写唯一 slug，只用小写字母、数字和连字符，例如 `legal-ai-seminar-2026`；网址为 `/legal-ai-seminar-2026.html`。已保存文章不可直接改 slug。
2. 选择新闻／活动及分类，分别填写新闻发布日期和可选的活动日期。
3. 填写英文、简体、繁体的标题、摘要和正文；三语均需完整，本版不自动翻译。
4. 选择封面、填写图片描述；正文通过“图片与图注”组件插图。切换三语预览，检查详情与列表卡片。
5. 设置首页推荐和优先级，保存并检查预览。复用旧文可在“已发布”菜单选“复制”，必须更换新 slug，并更新日期和三语内容。

上传仅支持 JPG／PNG／WebP，单张不超过 10 MB。原图入仓库，构建输出最大 2400 × 2400 范围的压缩版。图片字段有限制，构建再次复核；失败时替换或移除不合规上传文件，不要通过放宽校验解决。媒体库及 Git 历史公开，不上传敏感材料。

### 日期、首页和可见性

| 字段 | 意义 |
| --- | --- |
| `publishedAt` | 新闻发布日期，按香港日期校验；不支持未来发布日期或定时发布 |
| `eventDate` | 活动发生日期，可以在未来，不代替新闻发布日期 |
| `publicationDateNeedsReview` / `legacyDate` | 历史日期待核对标记及原日期；负责人核实后再关闭标记 |
| `featured` | 是否允许首页推荐 |
| `priority` | 0–100，越高越靠前，同级按发布日期倒序 |
| `visibility: published` | 详情及列表正常显示 |
| `visibility: archived` | 保留详情网址和搜索，从首页／列表移除 |
| `visibility: hidden` | 不生成详情，不进入列表或搜索，可从编辑器集合找到后恢复 |

首页新闻和活动各取配置数量，默认各 3 条，在“首页显示设置”维护。历史日期已标记待核对，LEXFLOW 保留未来活动日期，未知新闻发布日期留空。不要为消除提示编造日期。

一般旧新闻用归档，不要“删除内容”造成旧链接失效。公开仓库下架不等于保密删除，历史提交仍可能保留内容。

### 线上草稿与审核

生产使用 `editorial_workflow`：草稿保存到内容分支／PR，批准并合并 main 后才构建上线。管理总览只汇总已构建站点内容，未发布稿件在编辑器“草稿与审核”查看。

Decap 状态不是强制审批。每个编辑账号需仓库 push 权限；强制他人审核需另配 GitHub 分支保护，并在 GitHub 合并满足规则的 PR。没有独立 PR 预览站，编辑器实时预览不等于可分享的外部预览 URL。官网没更新先检查合并和 Actions，不要重复创建同一新闻。

## 6. 文件及配置位置

```text
content/news/*.json          三语新闻／活动唯一内容源
content/settings.json       官网、仓库、authUrl、首页数量，不含秘密
content/legacy-routes.json   迁移前网址清单
src/_includes/              首页、列表、详情原布局模板
src/*.11ty.js               Eleventy 生成入口
lib/news.mjs                校验、净化、排序及渲染
lib/cms-config.mjs          Decap 配置生成器，无需手建 admin/config.yml
admin/                     静态管理面板及自托管 Decap 资源
auth/                      OAuth 服务及部署样例
scripts/                   本机启动及成品检查
test/                      内容和 OAuth 测试
.github/workflows/pages.yml Pages 检查及发布
_site/                     生成产物，不提交、不手改
```

根目录团队、研究、论文等 HTML 仍按原方式维护。旧首页／列表／8 篇新闻根 HTML 已迁入模板及内容，构建仍生成同名网址；Git 中这些删除是有意迁移，不代表成品页面丢失。不要复制旧文件覆盖新流程。

构建自动更新首页、列表、详情、搜索、sitemap、robots、site-version，以及 `admin/runtime.json`、`admin/content-index.json`。这些 JSON 都是公开产物，不得存秘密，修改应回到源配置。

Decap CMS 3.18.0 官方预编译文件及许可证在 `admin/vendor/`，不要遗漏分块 JS、CSS 和 WASM。Node 依赖固定在锁文件。无数据库迁移、无容器要求。

## 7. 服务器预检与备份

以下以 Linux + systemd + Nginx 为例，其他环境应先报告差异并复用现有方案，不强行安装第二套。只读检查示例：

```sh
uname -a
node --version
command -v node
nginx -v
sudo ss -ltnp
sudo systemctl status cail-cms-auth --no-pager
```

同名服务不存在时最后一项报错正常。systemd 的 Node 路径必须能被非 root 用户访问；`ProtectHome=true` 会阻止使用 home 下的 nvm Node。不要填 Mac 的 `/opt/homebrew/bin/node`。

备份实际将修改的 Nginx 站点文件、现有 service 和 `.env`（若存在），秘密备份限制权限。记录上线前 Git SHA、官网版本、Pages Source／Custom domain／Enforce HTTPS，不回贴完整秘密配置。

## 8. 配置 OAuth App 和认证服务

### 8.1 地址必须一致

假设负责人确定基址为 `https://auth.example.org/cail-cms-auth`（仅示例，须替换实际域名）：

- OAuth Homepage URL：`https://cail.hkust.edu.hk/admin/`
- OAuth Authorization callback URL：`https://auth.example.org/cail-cms-auth/callback`
- 服务器 `AUTH_URL` 与前端 `authUrl`：`https://auth.example.org/cail-cms-auth`，无末尾斜线，无 `/auth` 或 `/callback`。

由负责人在 GitHub Settings → Developer settings → OAuth Apps 创建／确认应用，安全配置 Client ID／Secret。Secret 不能填到网站字段或仓库代码。

### 8.2 文件与环境

建议目录 `/opt/cail-cms-auth`、无交互登录系统账号 `cail-cms`。先确认不与旧部署冲突，再按实际 OS 创建账号，在仓库根目录安装代码：

```sh
sudo install -d -o root -g root -m 755 /opt/cail-cms-auth
sudo install -o root -g root -m 644 auth/server.mjs auth/handler.mjs /opt/cail-cms-auth/
```

仅首次且目标不存在时，才从 `auth/.env.example` 创建 `.env`；已有文件不可覆盖。安全填写并设为 root 所有、`0600`。systemd EnvironmentFile 由管理器读取，不需向其他用户开放。

| 环境变量 | 配置 |
| --- | --- |
| `AUTH_URL` | 实际 HTTPS 认证基址 |
| `SITE_URL` | `https://cail.hkust.edu.hk`，不是认证域名 |
| `GITHUB_REPO` | `ybq0509/CAIL-Website` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth App 真实值，仅服务器保管 |
| `COOKIE_SECRET` | 高熵随机值至少 32 字符，可用 32 随机字节的十六进制形式 |
| `ALLOWED_USERS` | GitHub 用户名逗号分隔，初始可仅 `ybq0509`，不要留空 |
| `PORT` | 默认 `8787`，更换时同步反向代理 |

Cookie Secret 在服务器生成并安全写文件，不回传聊天。此服务只使用 Node 内置模块，两份 `.mjs` 即可，不需在 /opt 运行 npm install。

### 8.3 systemd

调整 `auth/cail-cms-auth.service.example`：验证 User、WorkingDirectory、EnvironmentFile、ExecStart 的 Node 绝对路径。示例 `/usr/bin/node` 不保证每台机器相同。保留非 root、NoNewPrivileges、PrivateTmp 和文件系统保护。

安装为 `/etc/systemd/system/cail-cms-auth.service` 后：

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now cail-cms-auth
sudo systemctl status cail-cms-auth --no-pager
curl --fail --silent --show-error http://127.0.0.1:8787/cail-cms-auth/health
```

期望 `{"status":"ok","provider":"github"}`。健康检查不代表 OAuth 已登录成功。故障可看 `sudo journalctl -u cail-cms-auth -n 80 --no-pager`，分享前脱敏。

### 8.4 Nginx 与 HTTPS

将 `auth/nginx.conf.example` 加入认证域名现有 HTTPS server 块，不覆盖整份配置，也不是配置到学校 GitHub Pages 上：

```nginx
location /cail-cms-auth/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_read_timeout 40s;
    add_header Cache-Control "no-store" always;
}
```

proxy_pass 不加末尾 `/`，必须保留路径前缀。变更前缀时同步 AUTH_URL、回调、前端和 location。证书须对实际域名有效并配置续期；不绕过证书警告或关闭 TLS 校验。

```sh
sudo nginx -t
sudo systemctl reload nginx
```

仅检查成功后重载。从服务器外部访问实际 HTTPS 健康地址及 /auth，确认 8787 无公网暴露、现有其他站点不受影响。

## 9. 前端配置与安全边界

在交接分支把 `content/settings.json` 的 `authUrl` 改为真实认证基址，其他字段保持本项目值。运行 npm ci、npm run check，检查 `_site/admin/runtime.json`：local 为 false、base_url 为认证 origin、auth_endpoint 含前缀和 /auth。生产不设置 `CAIL_LOCAL_CMS=1`。

只提交源配置，不手改生成 runtime，不提交 _site、.env、node_modules、真实凭据。成品不能包含服务端源码或秘密。

服务实现 OAuth state、PKCE、签名短期 HttpOnly／Secure cookie、固定官网 origin 弹窗通信，并核验 push 权限及账号名单。但 `public_repo` scope 覆盖用户可写的公开仓库，不仅本仓库，只给可信维护者使用。白名单不改变 GitHub 已有权限；移除白名单也不会自动撤销已发令牌，离岗／泄露还需处理 GitHub 授权及仓库权限。

管理页面不存秘密，robots 禁抓取不是访问控制，公开仓库草稿也不保密。细粒度编辑账号或隔离其他仓库授权需另行设计 GitHub App／认证方案，当前未提供。

## 10. Pages 切换与正式上线

改造后不能从源码根目录直接发布，必须让 Actions 发布 `_site/`，否则首页／新闻会缺失。

1. 认证服务可用、检查通过、负责人批准上线后，记录旧版本和回退方案。
2. 仓库 Settings → Pages，将 Source 设为 **GitHub Actions**；保留 `cail.hkust.edu.hk` 及 Enforce HTTPS，不改学校 CNAME。
3. 通过 PR 将交接分支合并 main，或按批准流程集成。远程有新增内容先整合，禁止强推。
4. `.github/workflows/pages.yml` 在 push main／手动触发时：Node 22 → npm ci → 测试和构建校验 → 上传 _site → 部署。PR 仅检查。该工作流不需要 OAuth Secret。
5. 核对 Actions 已启用、组织允许所用 actions、github-pages 环境允许 main，部署具备 pages: write 和 id-token: write；不扩大无关权限。
6. 部署成功后检查官网 `/site-version.json`，commit 应与 main 的实际发布提交一致，再做下节验收。

交接分支 push 后没有生产发布是预期。普通构建失败一般保留上次成功版本，但切换 Source 有风险，应保留维护窗口。首次只需服务器部署 OAuth；以后新闻走 GitHub Actions，不必每次上服务器。

## 11. 验收完成标准

- [ ] npm run check 成功，记录测试数和提交 SHA，未跳过校验。
- [ ] 服务非 root 常驻、可重启恢复、只监听 loopback，无本地文件代理公网暴露。
- [ ] 实际 HTTPS 健康地址正常、证书有效、Nginx 检查通过，其他站点无影响。
- [ ] 回调、AUTH_URL、前端 authUrl 一致，Secret 不在 Git／前端产物中。
- [ ] Pages Source 为 Actions，域名与 HTTPS 保留，实际部署成功。
- [ ] 首页、Events/News、原 8 篇详情、论文页和三语切换正常，图片图注完整。
- [ ] 负责人用允许的账号真实登录，非白名单／无仓库写权限者不能取得编辑授权。
- [ ] 使用获批准验收稿，测试三语编辑、封面、图注、草稿、审核／合并及上线；不得擅自在官网发布测试新闻。
- [ ] 首页／列表／详情／搜索同步，site-version commit 对应最新成功发布。
- [ ] 归档保留网址、下架移除详情，测试内容清理／恢复，不误删真实数据。
- [ ] 报告真实服务地址、目录及名称、Node 路径、公开 SHA／工作流链接、证书续期、日志和回退方式，不含秘密。

需要负责人登录／批准而无法继续时，说明已完成部分、阻塞项及具体操作，不能宣称全部完成。

## 12. 故障排查、更新与回退

| 现象 | 优先检查 |
| --- | --- |
| 本机连接失败 | 进程／端口、localhost:8767、不是双击源 HTML |
| 生产提示未配置登录 | authUrl 源配置、重新构建和部署是否完成 |
| OAuth 404／无法返回编辑器 | Nginx 前缀、回调地址、HTTPS cookie、弹窗、state 时效、官网 origin、账号及 push 权限 |
| 502 | 服务状态、Node 路径、端口、proxy_pass、脱敏日志 |
| 保存后官网没变 | 是否本机保存／草稿、是否合并 main、Actions、site-version |
| 构建失败 | 三语、日期、slug、图片类型／大小／路径、站内引用，修源内容后重试 |
| 首页缺失／显示源码目录 | 是否错误地从 branch 根目录发布，而非 _site |
| push fetch first | 检查并正常整合远程新提交，不强推覆盖 CMS 内容 |

更新认证代码时备份旧版，仅替换两份 .mjs，不覆盖 .env；重启后复查健康及登录。前端／新闻走 Git 和 Actions，不手改服务器上的生成页面。

回退前端：用正常 revert／恢复提交形成可审计的新提交并重新发布，不 reset／强推 main。基准 `256d63b` 是旧根目录静态模式，不含本版构建流程，若退回它，必须配套恢复旧 Pages 发布方式或旧成品发布流程。

回退认证：恢复备份代码及相应受保护配置，重启并验收；Nginx 仅恢复此次修改的具体文件，先检查再重载。更换 Cookie Secret 会使进行中的登录失效；OAuth App Secret 轮换由负责人按 GitHub 流程操作。

## 13. 功能边界与参考

未提供定时发布、自动翻译、独立编辑账号、强制审批引擎、后台一键历史回滚、数据库或私密草稿库。历史恢复用 Git；管理面板“历史”打开内容文件 GitHub 提交记录。

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)：发布源、产物和部署权限。
- [Decap GitHub backend](https://decapcms.org/docs/github-backend/)：GitHub 编辑账号需仓库 push 权限。
- [Decap 本地后端](https://decapcms.org/docs/working-with-a-local-git-repository/)：本地开发，不是生产认证。

交接报告必须区分：代码已推送、检查通过、认证部署、真实登录、官网发布；逐项报告事实和待办，不把前两项等同于上线。
