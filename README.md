# Aiko DSH Plugin Catalog

The public `aiko-dsh-plugin-catalog` package lists the npm package names allowed in the Aiko market. Plugin releases own their versions, descriptions, guides, screenshots and compatibility declarations.

The [Aiko DSH repository map](https://github.com/aiko-dsh-plugins/aiko-dsh-workbench/blob/main/docs/repository-map.md) explains this directory's place beside the private Host, Workbench, and Workspace repositories. Aiko and Yunyao use the same package membership; their profile templates and theme selection live in Workbench, not in this catalog.

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

`plugins-npm.json` is the source for this package's membership list; `scripts/build-npm.mjs` generates the publishable `dist/` archive and `tests/` checks the schema and integrity. The DSH 0.2 market integration and its pinned directory copy are maintained in [Workbench `modules/market` and `modules/plugin-catalog`](https://github.com/aiko-dsh-plugins/aiko-dsh-workbench/tree/codex/desktop-account-launcher/modules). Synchronize a membership change there when preparing that product's next build.

The former `dsh-market-source` and `dsh-office-source` GitHub remotes are unavailable. Market integration source is in Workbench; official DSH Office skills are selected by the Host profile. The retained private `dsh-bid-studio-source` and `dsh-ontology-kernel-source` repositories maintain their older npm compatibility line. A catalog entry is not evidence that a particular plugin version works with the current Host: inspect that package's compatibility metadata and validate an installation before release.

## License

Directory metadata: CC0-1.0. Each plugin owns the license notices for its own resources.
