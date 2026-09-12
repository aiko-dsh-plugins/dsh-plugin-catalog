# Aiko DSH Ontology Kernel

An installable DeepSeek Harness bundle that provides one ontology interface with two adapters:

- `aiko-dsh-ontology-kernel/local` persists definitions, objects, links, Functions, and Actions through the Harness storage domain.
- `aiko-dsh-ontology-kernel` projects the active runtime to the browser through typed Typert remotes.

The user installs one bundle; the internal local and remote adapters are implementation details.

## Install from npm

```sh
dsh plugin --profile web add aiko-dsh-ontology-kernel@0.1.4
dsh --profile web --dump-config
dsh --profile web
```

Published npm packages contain runtime artifacts under `lib/` and do not execute a `prepare` script.

## Interface

Business plugins import ontology definitions from `aiko-dsh-ontology-kernel/runtime` and contribute versioned object types, link types, Functions, Actions, and their implementations through `ctx.ontology.register(...)`. Browser plugins use `ctx.ontologyRemote` and do not depend on the local storage adapter.

The bundle inserts `ontology-local` before `ontology-remote`. A later profile patch may replace either row with another adapter without changing business plugins.
