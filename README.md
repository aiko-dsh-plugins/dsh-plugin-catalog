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

## License

CC0-1.0
