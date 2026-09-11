/** Static archive checks and resumable search behavior without public-network fixtures. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { create } from 'tar'
import { buildFeed, collectRepositories, createClient, inspectArtifact, inspectPending, inspectRepository, newState, repositoryOf, Unavailable } from '../scripts/github-discovery.mjs'

const manifest = { name: 'dsh-example', version: '1.2.3', main: 'index.js', repository: 'https://github.com/author/example.git', dsh: { bundle: { patch: './cordis.patch.yml' } } }
const repo = { full_name: 'author/example', default_branch: 'main', pushed_at: '2026-09-10T00:00:00Z', stargazers_count: 3 }
async function artifact(pkg = manifest, { patch = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-discovery-'))
  try {
    await mkdir(join(dir, 'package'))
    await writeFile(join(dir, 'package/package.json'), JSON.stringify(pkg))
    await writeFile(join(dir, 'package/index.js'), 'throw new Error("must not execute")')
    if (patch) await writeFile(join(dir, 'package/cordis.patch.yml'), '- insert: []\n')
    const stream = create({ cwd: dir, gzip: true }, ['package'])
    const parts = []
    for await (const chunk of stream) parts.push(chunk)
    return Buffer.concat(parts)
  } finally { await rm(dir, { recursive: true, force: true }) }
}
const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`

test('inspects actual artifacts without running their code and rejects missing files/false identities', async () => {
  const bytes = await artifact()
  assert.equal(inspectArtifact(bytes, { name: manifest.name, repository: repo.full_name, integrity: integrity(bytes) }).version, '1.2.3')
  assert.throws(() => inspectArtifact(bytes, { name: 'other' }), /identity/)
  assert.throws(() => inspectArtifact(bytes, { name: manifest.name, version: '2.0.0' }), /identity/)
  assert.throws(() => inspectArtifact(bytes, { name: manifest.name, repository: 'evil/example' }), /repository/)
  assert.throws(() => inspectArtifact(bytes, { name: manifest.name, integrity: 'sha512-bad' }), /integrity/)
  const missing = await artifact(manifest, { patch: false })
  assert.throws(() => inspectArtifact(missing, { name: manifest.name }), /patch/)
  const traversal = await artifact({ ...manifest, dsh: { bundle: { patch: '../escape.yml' } } })
  assert.throws(() => inspectArtifact(traversal, { name: manifest.name }), /identity/)
  const missingExport = await artifact({ ...manifest, exports: { '.': { import: './lib/missing.js' } } })
  assert.throws(() => inspectArtifact(missingExport, { name: manifest.name }), /runtime entry/)
})

test('exact repository identity rejects lookalike metadata', () => {
  assert.equal(repositoryOf('git+https://github.com/Author/Example.git'), 'author/example')
  assert.equal(repositoryOf('github:author/example'), 'author/example')
  assert.notEqual(repositoryOf('https://github.com/evil/author-example'), 'author/example')
  assert.equal(repositoryOf('https://evil.test/author/example'), null)
})

test('splits the 1000-result limit, persists pagination and removes old entries only after a complete scan', async () => {
  const state = newState(new Date('2026-09-12T00:00:00Z'))
  state.repositories['old/repo'] = { repo: { ...repo, full_name: 'old/repo' }, seen: 'previous' }
  const queries = []
  const client = { async request(url) {
    queries.push(new URL(url).searchParams)
    if (queries.length === 1) return { total_count: 1500, items: [], incomplete_results: false }
    return { total_count: 1, items: [repo], incomplete_results: false }
  } }
  await collectRepositories(client, state, { maxSearchRequests: 2 })
  assert.equal(state.scan.queue.length, 1)
  assert.ok(state.repositories['old/repo'])
  assert.ok(queries[1].get('q').includes('fork:true'))
  await collectRepositories(client, state, { maxSearchRequests: 1 })
  assert.equal(state.scan.queue.length, 0)
  assert.equal(state.repositories['old/repo'], undefined)
  assert.ok(state.repositories['author/example'])
  const paging = newState()
  await collectRepositories({ request: async () => ({ total_count: 101, items: [repo] }) }, paging, { maxSearchRequests: 1 })
  assert.equal(paging.scan.queue[0].page, 2)
  assert.equal(buildFeed(paging).discovery.complete, false)
})

test('npm inspection uses the published version, integrity and exact repository', async () => {
  const bytes = await artifact()
  const client = { async request(url) {
    if (url.includes('raw.githubusercontent')) return { ...manifest, version: '2.0.0' }
    if (url.endsWith('/latest')) return { ...manifest, dist: { tarball: 'https://registry.npmjs.org/dsh-example/-/dsh-example-1.2.3.tgz', integrity: integrity(bytes) } }
    return bytes
  } }
  const [plugin] = await inspectRepository(client, repo)
  assert.equal(plugin.version, '1.2.3')
  assert.equal(plugin.discovery.status, 'published')
  assert.match(plugin.install, /dsh-example@1.2.3$/)
})

test('source-only bundles and monorepo packages are visible without an install target', async () => {
  const client = { async request(url) {
    if (url.includes('/git/trees/')) return { tree: [{ type: 'blob', path: 'packages/one/package.json' }], truncated: false }
    if (url.includes('packages/one/package.json')) return manifest
    if (url.includes('raw.githubusercontent')) return { workspaces: ['packages/*'] }
    return null
  } }
  const [plugin] = await inspectRepository(client, repo)
  assert.equal(plugin.url, 'https://github.com/author/example/tree/main/packages/one')
  assert.equal(plugin.discovery.status, 'source-only')
  assert.equal(plugin.install, '')
})

test('same-repository release tgz enables installation while an unrelated asset does not', async () => {
  const bytes = await artifact()
  const url = 'https://github.com/author/example/releases/download/v1.2.3/plugin.tgz'
  const client = { async request(at) {
    if (at.includes('raw.githubusercontent')) return manifest
    if (at.includes('registry.npmjs')) return null
    if (at.endsWith('/releases/latest')) return { assets: [{ browser_download_url: 'https://github.com/evil/example/releases/download/v1/x.tgz' }, { browser_download_url: url, size: bytes.length }] }
    assert.equal(at, url)
    return bytes
  } }
  const [plugin] = await inspectRepository(client, repo)
  assert.equal(plugin.tarball, url)
  assert.equal(plugin.discovery.status, 'published')
})

test('failed changed repositories remain retryable and do not publish stale install proposals', async () => {
  const state = newState()
  state.repositories.x = { repo, checkedAt: '2026-09-01T00:00:00Z', checkedPush: 'old', plugins: [{ name: 'stale' }] }
  const failures = await inspectPending({ request: async () => { throw new Unavailable('HTTP 429: api.github.com') } }, state)
  assert.equal(failures.length, 1)
  assert.equal(state.repositories.x.checkedPush, 'old')
  assert.equal(buildFeed(state).count, 0)
  assert.equal(buildFeed(state).discovery.checked, 0)
})

test('HTTP client sends credentials only to GitHub API and reports quota failures', async () => {
  const calls = []
  const client = createClient({ token: 'test-secret', searchDelayMs: 0, fetchImpl: async (url, init) => {
    calls.push({ url, headers: init.headers })
    return Response.json({ ok: true })
  } })
  await client.request('https://api.github.com/repos/author/example')
  await client.request('https://registry.npmjs.org/dsh-example/latest')
  assert.equal(calls[0].headers.authorization, 'Bearer test-secret')
  assert.equal(calls[1].headers.authorization, undefined)
  assert.equal(calls[1].headers.accept, 'application/json')
  const limited = createClient({ fetchImpl: async () => new Response(null, { status: 403 }) })
  await assert.rejects(limited.request('https://api.github.com/repos/author/example'), /HTTP 403/)
})

test('incomplete GitHub searches are partitioned even below 1000 matches', async () => {
  const state = newState()
  await collectRepositories({ request: async () => ({ total_count: 100, items: [], incomplete_results: true }) }, state, { maxSearchRequests: 1 })
  assert.equal(state.scan.queue.length, 2)
  assert.equal(buildFeed(state).discovery.complete, false)
})

test('inspection failures rotate behind unattempted repositories', async () => {
  const state = newState()
  state.repositories.first = { repo }
  state.repositories.second = { repo: { ...repo, full_name: 'author/second' } }
  const visited = []
  const client = { request: async url => { visited.push(url); throw new Unavailable('network unavailable') } }
  await inspectPending(client, state, { maxRepositories: 1 })
  await inspectPending(client, state, { maxRepositories: 1 })
  assert.match(visited[0], /author\/example/)
  assert.match(visited[1], /author\/second/)
})
