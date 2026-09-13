import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(root, 'backend');
const isWindows = process.platform === 'win32';
const pythonCandidates = isWindows
  ? [resolve(backend, '.venv', 'Scripts', 'python.exe'), 'python']
  : [resolve(backend, '.venv', 'bin', 'python'), 'python3', 'python'];
const python = pythonCandidates.find(candidate => candidate.includes('python') ? (candidate === 'python' || candidate === 'python3' || existsSync(candidate)) : false) || 'python';
const processes = [];

function start(name, command, args, cwd, color) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows && command.endsWith('.cmd')
  });
  processes.push(child);
  child.once('error', error => {
    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });
  child.once('exit', (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] stopped with code ${code ?? signal}`);
      shutdown(code || 1);
    }
  });
  console.log(`${color}[${name}] running${'\x1b[0m'}`);
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('frontend', isWindows ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1'], root, '\x1b[36m');
console.log('\nFlow Cast AI is starting locally: http://127.0.0.1:5173');
console.log('API docs: https://flow-cast-ai.onrender.com/docs');
console.log('Press Ctrl+C to stop both servers.');
