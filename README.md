# Aiko DSH Plugin Catalog

Organization-curated plugins for Aiko DeepSeek Harness deployments. The catalog follows the `plugins.json` format consumed by `dshmarket`.

## Use with Aiko dsh-market

```yaml
- id: dsh-market
  name: dshmarket
  config:
    additionalRegistryUrls:
      - https://raw.githubusercontent.com/aiko-dsh-plugins/dsh-plugin-catalog/main/plugins.json
```

The official catalog remains enabled. Every additional catalog is required and merged by repository URL; an unavailable catalog is reported instead of silently hiding its plugins.

## Updating the catalog

Edit `plugins.json`, keep `count` equal to the number of plugin entries, and use immutable GitHub Release assets for `tarball` whenever available.

Each released entry declares its package `version`. The Aiko market is listed separately as `dsh-market (Aiko)` with npm identity `dshmarket` and its Aiko GitHub release artifact. Keep this repository URL and distribution source stable across updates. Desktop market 1.37.0-aiko.2 compares versions only within the installed source and refuses replacements from another repository or from npm. Publish the new market asset before advancing its catalog entry.

Publish every referenced release asset before updating the live catalog. Bid Studio 0.2.1 requires Ontology Kernel 0.1.2 and the DSH 0.1.5-alpha.2 client APIs; the desktop installation path additionally requires Aiko dsh-market 1.37.0-aiko.0 and its desktop bridge v1. Keep the Kernel repository in the scene plugin's `requires` list so the market installs it first.

## Private source and public distribution

Active development uses independent private repositories. Existing public repositories preserve previously published source and remain the download locations for release assets. The catalog and all current tarball URLs stay public and unchanged, so installed clients do not need GitHub credentials or a source migration.

| Component | Private development repository | Public release repository |
|---|---|---|
| Desktop client | `aiko-dsh-plugins/deepseek-harness-source` | `aiko-dsh-plugins/deepseek-harness` |
| Market | `aiko-dsh-plugins/dsh-market-source` | `aiko-dsh-plugins/dsh-market` |
| Office | `aiko-dsh-plugins/dsh-office-source` | `aiko-dsh-plugins/dsh-office` |
| Bid Studio | `aiko-dsh-plugins/dsh-bid-studio-source` | `aiko-dsh-plugins/dsh-bid-studio` |
| Ontology Kernel | `aiko-dsh-plugins/dsh-ontology-kernel-source` | `aiko-dsh-plugins/dsh-ontology-kernel` |

Local development checkouts push to their `source` remote by default. Commit implementation changes and version tags only in the private repository. Public repositories receive release assets and user documentation, not private source commits. Their automatically generated Git source archives represent the public history; use the attached `.tgz` files for new plugin versions.

Build and test in the private checkout, then publish a new immutable version through an authenticated maintainer's `gh` CLI with an explicit `--repo aiko-dsh-plugins/<public-release-repository>`. Do not upload a rebuilt package over an existing version. Update `plugins.json` only after the new public assets are downloadable without authentication. The npm `repository` fields remain public distribution identities because Desktop update checks match installed packages to those sources.

Private Actions artifacts are not public downloads. The market's `Aiko market package` workflow and Office build workflows produce artifacts for maintainers to download and publish to the corresponding public release repository. This process needs no GitHub token in the desktop application. Upstream market npm publishing and site deployment apply only in the upstream repository.

Previously published code and packages remain public. New plugin packages omit optional TypeScript source trees and browser source maps; executable JavaScript and Office's required Python scripts are still distributed and can be inspected. Private repository visibility controls development access, not access to code required to run a public plugin.

## License

CC0-1.0
