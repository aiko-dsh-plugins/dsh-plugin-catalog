/** Generate the optional market feed; resumable state stays outside the published catalog. */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { buildFeed, collectRepositories, createClient, inspectPending, newState } from './github-discovery.mjs'

const { values } = parseArgs({ options: {
  output: { type: 'string', default: 'github-topic.json' },
  state: { type: 'string', default: '.discovery-cache/state.json' },
  'search-requests': { type: 'string', default: '20' },
  'check-repositories': { type: 'string', default: '60' },
  'recheck-hours': { type: 'string', default: '168' },
} })
const positive = key => {
  const value = Number(values[key])
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`--${key} requires a positive integer`)
  return value
}
const options = { maxSearchRequests: positive('search-requests'), maxRepositories: positive('check-repositories'), recheckHours: positive('recheck-hours') }
const statePath = resolve(values.state)
const outputPath = resolve(values.output)
if (statePath === outputPath) throw new Error('State and feed must use different files')
let state
try { state = JSON.parse(await readFile(statePath, 'utf8')) }
catch (error) { if (error.code !== 'ENOENT') throw error; state = newState() }
if (state.version !== 1 || !state.repositories || !Array.isArray(state.scan?.queue)) throw new Error('Unsupported discovery state')

async function save(path, value) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n')
  await rename(temporary, path)
}

const client = createClient({ token: process.env.GITHUB_TOKEN, searchDelayMs: process.env.GITHUB_TOKEN ? 2100 : 6100 })
try {
  await collectRepositories(client, state, options)
  const failures = await inspectPending(client, state, options)
  const feed = buildFeed(state)
  await save(outputPath, feed)
  console.log(JSON.stringify({ output: outputPath, plugins: feed.count, ...feed.discovery, failedInspections: failures.length }))
  for (const failure of failures) console.error(`${failure.repository}: ${failure.error}`)
} finally {
  await save(statePath, state)
}
