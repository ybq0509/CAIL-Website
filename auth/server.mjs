import http from 'node:http';
import { authConfig, handleAuth } from './handler.mjs';
const config = authConfig(process.env);
const server = http.createServer(async (incoming, outgoing) => {
  try {
    const request = new Request(new URL(incoming.url, new URL(config.authUrl).origin), { method: incoming.method, headers: incoming.headers });
    const response = await handleAuth(request, config);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); outgoing.end('认证服务暂不可用'); }
});
server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log('CAIL CMS authentication listening on 127.0.0.1:' + (process.env.PORT || 8787)));
