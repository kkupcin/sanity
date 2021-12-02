/**
 * Reads the Sanity build config from one of the following files (in preferred order):
 *   - sanity.build.js
 *   - sanity.build.ts
 *
 * Note: There are two ways of using this:
 * a) Through the exported `getBuildConfig()` method (async)
 * b) Through `child_process.fork()` and waiting for a message over the IPC channel
 *
 * Approach a is generally a bit faster as it avoids the forking startup time, while
 * approach b could be considered "safer" since any side-effects of running the config
 * file will not bleed into the current CLI process directly.
 *
 * Given that we shave off about 30ms on an M1 Mac using approach A, we're going to use
 * that approach for now until we potentially run into trouble with lack of isolation.
 */
import path from 'path'
import {stat} from 'fs/promises'
import {register} from 'esbuild-register/dist/node'

export interface BuildConfig {
  api?: {
    projectId: string
    dataset: string
  }
  project?: {
    name?: string
    basePath?: string
  }
  server?: {
    hostname?: string
    port?: number
  }
}

if (typeof process.send === 'function') {
  const send = process.send
  // We're communicating with a parent process through IPC message channels
  getBuildConfig()
    .then((config) => send({type: 'config', config}))
    .catch((error) => send({type: 'error', error}))
}

export async function getBuildConfig(): Promise<BuildConfig | null> {
  const {unregister} = register()

  try {
    return await getSanityBuildConfig()
  } catch (err) {
    throw err
  } finally {
    unregister()
  }
}

async function getSanityBuildConfig(): Promise<BuildConfig | null> {
  const jsConfigPath = path.join(process.cwd(), 'sanity.build.js')
  const tsConfigPath = path.join(process.cwd(), 'sanity.build.ts')

  const [js, ts] = await Promise.all([
    stat(jsConfigPath).then(yes, nope),
    stat(tsConfigPath).then(yes, nope),
  ])

  if (!js && !ts) {
    return null
  }

  if (!js && ts) {
    return importConfig(tsConfigPath)
  }

  if (js && ts) {
    warn('Found both `sanity.build.js` and `sanity.build.ts` - using sanity.build.js')
  }

  return importConfig(jsConfigPath)
}

async function importConfig(filePath: string): Promise<BuildConfig | null> {
  try {
    const config = await import(filePath)
    if (config === null || typeof config !== 'object') {
      throw new Error('Module export is not a configuration object')
    }

    return config.default || config
  } catch (err) {
    console.error(`Error reading "${filePath}": ${err.message}`)
    return null
  }
}

function warn(warning: string) {
  if (typeof process.send === 'function') {
    process.send({type: 'warning', warning})
  } else {
    console.warn(warning)
  }
}

function yes() {
  return true
}

function nope() {
  return false
}