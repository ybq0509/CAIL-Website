import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
// Eleventy 3 logs unlink events but does not rebuild for them. Touch a template
// (without changing its contents) so local article deletion triggers a rebuild.
const deletionWatcher = fs.watch('content/news', (event, filename) => {
  if (event === 'rename' && filename?.endsWith('.json') && !fs.existsSync(path.join('content/news', filename))) { const now = new Date(); fs.utimesSync('src/index.11ty.js', now, now); }
});
const children = [];
let stopping = false;
function stop(signal = 'SIGTERM') { if (stopping) return; stopping = true; deletionWatcher.close(); for (const child of children) child.kill(signal); }
for (const args of [[fileURLToPath(new URL('./local-cms.mjs', import.meta.url))], ['node_modules/@11ty/eleventy/cmd.cjs', '--serve', '--port=8767']]) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env: { ...process.env, CAIL_LOCAL_CMS: '1' } });
  children.push(child);
  child.on('exit', code => { if (!stopping) { console.error('本地服务已停止，退出码：', code); stop(); process.exitCode = code || 0; } });
}
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => stop(signal));
console.log('CAIL 本机内容管理：http://localhost:8767/admin/');
console.log('内容只保存到本机；不会自动提交 Git 或发布到正式站。按 Ctrl+C 关闭两个服务。');
