import { randomBytes, createHmac, timingSafeEqual, createHash } from 'node:crypto';

const cookieName = '__Host-cail-cms-state';
const same = (a, b) => { const aa = Buffer.from(a || ''), bb = Buffer.from(b || ''); return aa.length === bb.length && timingSafeEqual(aa, bb); };
const base64 = value => Buffer.from(value).toString('base64url');
const sign = (value, secret) => createHmac('sha256', secret).update(value).digest('base64url');
const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };

export function authConfig(env) {
  const authUrl = new URL(env.AUTH_URL);
  const site = new URL(env.SITE_URL || 'https://cail.hkust.edu.hk');
  if (authUrl.protocol !== 'https:' || site.protocol !== 'https:' || authUrl.search || authUrl.hash || authUrl.username) throw new Error('AUTH_URL 和 SITE_URL 必须使用 HTTPS。');
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || String(env.COOKIE_SECRET || '').length < 32) throw new Error('请配置 GitHub OAuth 凭据和至少 32 位 COOKIE_SECRET。');
  return { authUrl: authUrl.href.replace(/\/$/, ''), siteOrigin: site.origin, siteHost: site.hostname, repo: env.GITHUB_REPO || 'ybq0509/CAIL-Website', clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, secret: env.COOKIE_SECRET, allowedUsers: (env.ALLOWED_USERS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean) };
}
function cookie(value, maxAge = 600) { return `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`; }
function reply(message, config, success = false) {
  const nonce = randomBytes(18).toString('base64');
  const safe = value => JSON.stringify(value).replace(/</g, '\\u003c');
  const script = `const origin=${safe(config.siteOrigin)};const payload=${safe('authorization:github:' + (success ? 'success:' : 'error:') + JSON.stringify(message))};if(window.opener){window.addEventListener('message',function handshake(event){if(event.origin!==origin||event.source!==window.opener||event.data!=='authorizing:github')return;window.removeEventListener('message',handshake);window.opener.postMessage(payload,origin);setTimeout(()=>window.close(),100);});window.opener.postMessage('authorizing:github',origin);}`;
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>CAIL 登录</title><p>${success ? '登录成功，正在返回编辑器。' : '登录未完成，请关闭此窗口后重试。'}</p><script nonce="${nonce}">${script}</script></html>`, { status: success ? 200 : 400, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0), 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'` } });
}
export async function handleAuth(request, config, fetcher = fetch) {
  const url = new URL(request.url), base = new URL(config.authUrl), route = url.pathname.slice(base.pathname.replace(/\/$/, '').length);
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers });
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/')) return new Response('Not found', { status: 404, headers });
  if (route === '/health') return Response.json({ status: 'ok', provider: 'github' }, { headers: { ...headers, 'Access-Control-Allow-Origin': config.siteOrigin } });
  if (route === '/auth') {
    if (url.searchParams.has('provider') && url.searchParams.get('provider') !== 'github') return new Response('Unsupported provider', { status: 400, headers });
    if (url.searchParams.has('site_id') && url.searchParams.get('site_id') !== config.siteHost) return new Response('Invalid site', { status: 400, headers });
    const state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url');
    const data = base64(JSON.stringify({ state, verifier, issued: Date.now() }));
    const auth = new URL('https://github.com/login/oauth/authorize');
    for (const [key, value] of Object.entries({ client_id: config.clientId, redirect_uri: config.authUrl + '/callback', scope: 'public_repo', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' })) auth.searchParams.set(key, value);
    return new Response(null, { status: 302, headers: { ...headers, Location: auth.href, 'Set-Cookie': cookie(data + '.' + sign(data, config.secret)) } });
  }
  if (route !== '/callback') return new Response('Not found', { status: 404, headers });
  try {
    const raw = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
    const [data, signature] = raw.split('.');
    if (!data || !same(sign(data, config.secret), signature)) throw new Error('登录会话无效或已过期');
    const session = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!same(session.state, url.searchParams.get('state')) || Date.now() - session.issued > 600000 || session.issued > Date.now()) throw new Error('登录状态无效或已过期');
    const code = url.searchParams.get('code'); if (!code || code.length > 1024 || url.searchParams.has('error')) throw new Error('GitHub 登录未完成');
    const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: config.authUrl + '/callback', code_verifier: session.verifier }), signal: AbortSignal.timeout(15000) });
    if (!tokenResponse.ok) throw new Error('GitHub 认证暂不可用');
    const token = await tokenResponse.json(); if (!token.access_token || token.error) throw new Error('GitHub 未返回有效授权');
    const apiHeaders = { Authorization: 'Bearer ' + token.access_token, Accept: 'application/vnd.github+json', 'User-Agent': 'CAIL-CMS-Auth' };
    const [userResponse, repoResponse] = await Promise.all([fetcher('https://api.github.com/user', { headers: apiHeaders, signal: AbortSignal.timeout(15000) }), fetcher('https://api.github.com/repos/' + config.repo, { headers: apiHeaders, signal: AbortSignal.timeout(15000) })]);
    if (!userResponse.ok || !repoResponse.ok) throw new Error('无法验证仓库权限');
    const user = await userResponse.json(), repo = await repoResponse.json();
    if (!repo.permissions?.push || config.allowedUsers.length && !config.allowedUsers.includes(user.login?.toLowerCase())) throw new Error('此账号没有内容编辑权限');
    return reply({ token: token.access_token, provider: 'github' }, config, true);
  } catch { return reply({ message: '登录失败、已过期或没有仓库编辑权限。请重新登录或联系管理员。' }, config); }
}
