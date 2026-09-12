# Aiko DSH Plugin Catalog

Organization-curated plugins for Aiko DeepSeek Harness deployments. The public `aiko-dsh-plugin-catalog` npm package supplies plugin versions, installation dependencies, English and Chinese help, and embedded screenshots. `plugins-npm.json` is its source manifest; `plugins.json` preserves legacy GitHub installation targets.

## Use with Aiko dsh-market

```yaml
- id: dsh-market
  name: aiko-dsh-market
  config:
    additionalRegistryPackages:
      - aiko-dsh-plugin-catalog
```

Requires Aiko dsh-market 1.38.0 or later. The official catalog remains enabled. Every additional catalog is required and merged by its stable repository URL identifier; an unavailable catalog is reported instead of silently hiding its plugins. Public links use npm homepages and this catalog's issue tracker. Reading the four Aiko plugins' help and screenshots does not fetch their GitHub repositories or download Office's runtime archive.

The market resolves the latest catalog version through its regional npm registry, verifies SHA-512 integrity, and reads `plugins.json` from the bounded archive without extracting or executing it. The published catalog has no dependencies or scripts. Help is rendered as Markdown with inline raster images; raw HTML and remote Markdown images are not loaded.

## GitHub community discovery

`github-topic.json` is an optional discovery feed for Aiko dsh-market, separate from the curated `plugins.json`. Enable its public raw URL under `discoveryRegistryUrls`. Publish this feed before releasing a market Bundle that references it. GitHub Topic membership is community metadata, not DeepSeek certification.

Run `npm ci --ignore-scripts`, then `npm test` and `npm run discover`. The collector reads `GITHUB_TOKEN` only for GitHub API requests; the token is never written to the feed or sent to npm. Public reads also work without authentication with a slower search cadence. It supports `--search-requests`, `--check-repositories`, `--recheck-hours`, `--state` and `--output`. Defaults are 20 search requests, 60 repository inspections and a seven-day recheck interval per run.

Collection partitions searches by repository creation time to avoid GitHub's 1,000-result ceiling, persists pagination in `.discovery-cache/state.json`, and removes disappeared repositories only after a completed scan. Search results change during collection, so scans are not atomic snapshots. A failed search preserves the last published file. Inspection failures remain retryable and contribute no stale installation targets. Previously attempted repositories rotate behind unattempted ones. Counts describe repositories collected so far; partial scans are explicitly marked incomplete.

The collector checks root packages and monorepo package manifests, excluding dependency/vendor/test/example trees. Oversized or truncated trees remain unverified. It reads actual npm or same-repository Release archives in memory, checks package identity, Bundle patch and runtime entry presence, and verifies npm provenance and SHA-512. No archive files are extracted or executed. A checked archive is not a security review, transitive dependency check or runtime compatibility test. Source-only bundles are published without an install target.

The GitHub Actions workflow runs every four hours and on manual dispatch. It tests the collector, restores resumable state, updates only `github-topic.json`, and uses a normal push to `main`; remote movement fails the push instead of overwriting commits. The workflow needs repository Actions enabled and permission for `GITHUB_TOKEN` to write contents. Source changes are not live until pushed. Local cache files are ignored and must not be published.

## Curated entries

Edit `plugins-npm.json`, keep `count` equal to the number of plugin entries, and select an exact published npm package and version. Omit `tarball` for npm entries. Keep repository identifiers and dependency identifiers stable even when a repository is retired. Preserve `plugins.json` and its immutable GitHub Release URLs for older markets during migration.

Maintain `content/<npm-name>/en.md`, `zh.md`, and `images.json`. Screenshot filenames must name local PNG files in that directory. Include licenses and attribution for copied resources in `THIRD-PARTY-NOTICES.md`. The builder rejects missing dependencies, dependency cycles, invalid installation targets, oversized resources, and help links to the four retired plugin repositories.

Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, and `npm pack ./dist --ignore-scripts`. Publish the checked data archive after all referenced plugin versions are anonymously available from npm. Increment the catalog version for each publication. Publishing the repository root is disabled with `private: true`; only `dist` is publishable. Changing GitHub source files alone does not update the npm catalog.

Each released entry declares its package `version`. The npm market identity is `aiko-dsh-market`; the legacy feed uses `dshmarket` with an Aiko GitHub release artifact. Desktop compares versions only within the installed source. Existing profiles retain their package sources and require an explicit reinstall through the native plugin manager to migrate to npm. Remove `dshmarket` before installing `aiko-dsh-market`, because both packages contribute the same configuration row.

Publish and anonymously verify every referenced npm version before updating the live npm catalog. Bid Studio 0.2.3 supports Ontology Kernel ^0.1.3; this catalog selects 0.1.4. It requires the DSH 0.1.5-alpha.2 client APIs; the desktop installation path additionally requires Aiko's desktop bridge v1. Keep the Kernel identifier in the scene plugin's `requires` list so the market installs it first.

## Private source and public distribution

Active development uses independent private repositories. npm distributes plugins and their catalog resources; GitHub Releases distributes Mac application ZIPs. New clients use npm. Existing profiles retain their installed package sources and explicit catalog overrides: migrate those profiles and clear legacy organization URLs before retiring their GitHub release repositories. Deleting a repository does not redirect old lockfile URLs or erase previously distributed code.

| Component | Private development repository | Public distribution |
|---|---|---|
| Desktop client | `aiko-dsh-plugins/deepseek-harness-source` | `aiko-dsh-plugins/deepseek-harness` |
| Market | `aiko-dsh-plugins/dsh-market-source` | `aiko-dsh-market` on npm |
| Office | `aiko-dsh-plugins/dsh-office-source` | `aiko-dsh-office` on npm |
| Bid Studio | `aiko-dsh-plugins/dsh-bid-studio-source` | `aiko-dsh-bid-studio` on npm |
| Ontology Kernel | `aiko-dsh-plugins/dsh-ontology-kernel-source` | `aiko-dsh-ontology-kernel` on npm |

Local development checkouts push to their `source` remote by default. Commit plugin implementation changes and version tags only in the private repository. This public catalog repository retains catalog resources, community discovery, and issue reporting. The public client repository retains Mac downloads.

Build and test in the private checkout, inspect the package contents, then publish the checked `.tgz` with `npm publish <artifact.tgz> --access public --tag latest --registry=https://registry.npmjs.org/`. Every release uses a new version. Advance the live catalog only after public npm metadata, integrity and anonymous installation are verified. Plugin metadata uses npm homepages and the catalog issue tracker; a public source repository is not required.

Private Actions artifacts are not public downloads. The market's `Aiko market package` workflow and Office's platform workflow produce checked npm artifacts for maintainers. The client's `Aiko Mac test client` workflow produces Apple Silicon and Intel Mac ZIPs for [public client downloads](https://github.com/aiko-dsh-plugins/deepseek-harness/releases). Fresh clients preinstall the npm market and leave Office optional. Existing download URLs remain valid. This process needs no GitHub token in the desktop application. Upstream market npm publishing and site deployment apply only in the upstream repository.

Previously published code and packages remain public. New plugin packages omit optional TypeScript source trees and browser source maps; executable JavaScript and Office's required Python scripts are still distributed and can be inspected. Private repository visibility controls development access, not access to code required to run a public plugin.

## License

Catalog metadata: CC0-1.0. Bundled help and screenshots: MIT; see `THIRD-PARTY-NOTICES.md`.
