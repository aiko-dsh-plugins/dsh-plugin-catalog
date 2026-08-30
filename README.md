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

Edit `plugins.json`, keep `count` equal to the number of plugin entries, and use immutable GitHub Release assets for `tarball` whenever available. A scene plugin declares required platform plugins with a `requires` array of catalog repository URLs. The market resolves those entries before the scene and prevents removal while an installed scene still depends on them.

## License

CC0-1.0
