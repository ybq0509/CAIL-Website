import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve('decap-server')], { stdio: 'inherit', env: { ...process.env, PORT: '8081', BIND_HOST: '127.0.0.1', MODE: 'fs', ORIGIN: 'http://localhost:8767', GIT_REPO_DIRECTORY: process.cwd() } });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code || 0));
