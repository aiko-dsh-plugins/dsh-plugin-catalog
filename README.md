# Aiko DSH Plugin Catalog

The public `aiko-dsh-plugin-catalog` package lists the npm package names allowed in the Aiko market. Plugin releases own their versions, descriptions, guides, screenshots and compatibility declarations.

## Use the directory

Aiko Market 1.39.0 or later reads this schema through `additionalRegistryPackages: [aiko-dsh-plugin-catalog]`. The directory contains no executable plugin code.

```json
{
  "schemaVersion": 2,
  "packages": ["aiko-dsh-market", "aiko-dsh-office", "aiko-dsh-ontology-kernel", "aiko-dsh-bid-studio"]
}
```

The market verifies the directory archive's SHA-512 integrity, then reads each listed package's npm manifest. Each refresh revalidates plugin releases even when the directory version has not changed. An unavailable plugin is marked separately and cannot be installed from stale metadata; other packages remain available.

Each plugin maintains `dsh.market` presentation fields and `dsh.compatibility.host` in its own manifest. Required activation dependencies use `dsh.compatibility.plugins`. Bilingual Markdown and embedded PNGs travel with the lightweight manifest, so browsing Office does not download its interpreters.

## Maintain and publish

Edit only package names in `plugins-npm.json`. Adding or removing a plugin requires a new directory version. Updating an existing plugin requires only publishing that plugin.

Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, then `npm pack ./dist --ignore-scripts`. Inspect and publish the resulting data archive. The root package is private; only the generated distribution is publishable. Ordinary builds do not contact npm or freeze plugin versions.

Schema 2 requires the updated market. Existing desktop installations also need the installer that repairs retired Aiko GitHub sources, replaces the old `dshmarket` identity and checks application compatibility. Publishing this directory alone does not repair an old application's persisted download URLs. The frozen legacy `plugins.json` is not the source for npm schema 2.

## GitHub community discovery

`github-topic.json` remains an optional community discovery feed. Its collector and tests are independent of the npm package directory. Run `npm run discover` to collect GitHub Topic candidates; configure its URL through `discoveryRegistryUrls`. Discovery status is evidence about publication, not official certification.

## Source and distribution

| Component | Private source repository | Public distribution |
|---|---|---|
| Desktop | `aiko-dsh-plugins/deepseek-harness-source` | [Mac client releases](https://github.com/aiko-dsh-plugins/deepseek-harness/releases) |
| Market | `aiko-dsh-plugins/dsh-market-source` | `aiko-dsh-market` on npm |
| Office | `aiko-dsh-plugins/dsh-office-source` | `aiko-dsh-office` on npm |
| Bid Studio | `aiko-dsh-plugins/dsh-bid-studio-source` | `aiko-dsh-bid-studio` on npm |
| Ontology Kernel | `aiko-dsh-plugins/dsh-ontology-kernel-source` | `aiko-dsh-ontology-kernel` on npm |

Publish checked artifacts from private source, then verify anonymous npm metadata, download integrity and installation. Source commits remain private. Runtime JavaScript, Python and required resources in public npm artifacts remain inspectable. Public plugin repository access is unnecessary.

## License

Directory metadata: CC0-1.0. Each plugin owns the license notices for its own resources.
