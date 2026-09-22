import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function hasDocker() {
  try {
    const res = spawnSync('docker', ['--version'], { stdio: 'ignore', windowsHide: true })
    return !res.error && res.status === 0
  } catch {
    return false
  }
}

function checkTcp(host, port, timeout = 5000) {
  return new Promise((resolveFn) => {
    let settled = false
    const socket = net.connect({ host, port })
    const finish = (ok) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolveFn(ok)
    }
    socket.setTimeout(timeout)
    socket.on('connect', () => finish(true))
    socket.on('timeout', () => finish(false))
    socket.on('error', () => finish(false))
  })
}

if (hasDocker()) {
  const res = spawnSync('docker', ['compose', '-f', 'infra/compose.dev.yml', 'up', '-d'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  })
  process.exit(res.status ?? 1)
}

const reachable = await checkTcp('127.0.0.1', 5433)
if (reachable) {
  console.log('no docker — using existing postgres at 127.0.0.1:5433')
  process.exit(0)
}
console.error('no docker available and no reachable postgres at 127.0.0.1:5433')
process.exit(1)
