# Aiko Plugin Market

Browse community and Aiko plugins, inspect their descriptions and previews, and install, update or remove published packages from DeepSeek Harness.

## Install

In the native plugin manager, install `aiko-dsh-market@1.38.0`. Open Settings → Plugin Market. An existing `dshmarket` installation must be removed first because both packages contribute the same configuration entry.

## Browse and install

Search by name or description and filter by category. Open README to read the English or Chinese guide inside the market. Previews and Aiko guides arrive in the lightweight npm catalog; browsing Office does not download its document runtimes. Installation uses the selected npm package and version.

Bid Studio requires Ontology Kernel. The market resolves the dependency order and prevents removal of a Kernel required by another installed plugin. The desktop application owns installation confirmation, activation checks and rollback.

## Sources

The Aiko bundle reads `aiko-dsh-plugin-catalog` through npm and keeps the community catalog and optional GitHub community discovery. A failed required catalog is shown as an error. Optional discovery failure does not disable the Aiko catalog.

Existing profiles retain their installed versions and sources. Moving a GitHub installation to npm requires explicit installation through the native plugin manager. A normal update never silently changes distribution source. Sessions and workspace data are retained during package migration.

## Feedback

[Report an issue](https://github.com/aiko-dsh-plugins/dsh-plugin-catalog/issues). Private development source is not needed to install or use these plugins.
