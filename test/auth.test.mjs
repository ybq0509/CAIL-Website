import test from 'node:test';
import assert from 'node:assert/strict';
import { authConfig, handleAuth } from '../auth/handler.mjs';
const config = authConfig({ AUTH_URL: 'https://auth.example/cail-cms-auth', SITE_URL: 'https://cail.hkust.edu.hk', GITHUB_CLIENT_ID: 'test-id', GITHUB_CLIENT_SECRET: 'test-secret', COOKIE_SECRET: 'test-cookie-secret-at-least-32-characters', ALLOWED_USERS: 'ybq0509' });
async function begin() {
  const response = await handleAuth(new Request(config.authUrl + '/auth?provider=github&site_id=cail.hkust.edu.hk'), config);
  return { response, state: new URL(response.headers.get('location')).searchParams.get('state'), cookie: response.headers.get('set-cookie').split(';')[0] };
}
test('OAuth uses signed HTTP-only cookie, state and PKCE', async () => {
  const {response} = await begin(); const location = new URL(response.headers.get('location'));
  assert.equal(response.status, 302); assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(response.headers.get('set-cookie').includes('HttpOnly')); assert.ok(response.headers.get('set-cookie').includes('Secure'));
  assert.equal(location.searchParams.get('redirect_uri'), config.authUrl + '/callback');
});
test('invalid state and tampered cookie never exchange tokens', async () => {
  const {cookie} = await begin(); let calls = 0;
  for (const value of [cookie, cookie + 'tampered']) {
    const response = await handleAuth(new Request(config.authUrl + '/callback?code=fake&state=wrong', {headers:{cookie:value}}), config, async () => {calls++;});
    assert.equal(response.status,400);
  }
  assert.equal(calls,0);
});
test('successful login checks repository permission and restricts postMessage origin', async () => {
  const {state,cookie} = await begin();
  const response = await handleAuth(new Request(config.authUrl + '/callback?code=fake&state=' + state, {headers:{cookie}}), config, async url => Response.json(url.endsWith('access_token') ? {access_token:'fake-access-token'} : url.endsWith('/user') ? {login:'ybq0509'} : {permissions:{push:true}}));
  assert.equal(response.status,200); const html = await response.text();
  assert.ok(html.includes('https://cail.hkust.edu.hk')); assert.ok(html.includes('event.source!==window.opener')); assert.ok(html.includes('authorization:github:success:')); assert.ok(!html.includes('postMessage(payload,"*")'));
  assert.ok(response.headers.get('set-cookie').includes('Max-Age=0'));
});
test('public repository read access is not enough to log in', async () => {
  const {state,cookie} = await begin();
  const response = await handleAuth(new Request(config.authUrl + '/callback?code=fake&state=' + state, {headers:{cookie}}), config, async url => Response.json(url.endsWith('access_token') ? {access_token:'fake-access-token'} : url.endsWith('/user') ? {login:'ybq0509'} : {permissions:{push:false}}));
  assert.equal(response.status,400); assert.ok(!(await response.text()).includes('fake-access-token'));
});
test('service rejects other sites and insecure configuration', async () => {
  assert.equal((await handleAuth(new Request(config.authUrl + '/auth?site_id=attacker.example'), config)).status,400);
  assert.throws(() => authConfig({AUTH_URL:'http://example.com'}));
});
