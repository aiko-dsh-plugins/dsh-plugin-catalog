# Aiko DSH Bid Studio

An installable DeepSeek Harness business application that contributes:

- a Bid Studio entry in the official desktop application sidebar;
- a complete tender ontology with object, relationship, Function, and Action definitions;
- a durable local execution route from tender intake to human review and export;
- an ontology inspector that renders every definition category and workflow step.

Bid Studio is a scene plugin built on the independently installed [Aiko DSH Ontology Kernel](https://www.npmjs.com/package/aiko-dsh-ontology-kernel). It contributes only the `bid.*` definition, executable adapters, tools, workflow, and workbench. The shared Kernel owns the ontology runtime, durable graph storage, and browser remotes so future contract and project workbenches can reuse one provider.

## Install through the market

Version 0.2.3 targets the official DSH 0.1.5-alpha.2 client APIs. In the Electron application with `aiko-dsh-market` installed, select **aiko-dsh-bid-studio** from the organization catalog and confirm installation. The market installs Ontology Kernel 0.1.4 first and activates both packages together. Navigation, workbench styles, the ontology inspector, and client remotes ship in this plugin's browser artifact.

The desktop-enabled market requires its accompanying desktop bridge; the unmodified upstream release does not expose that API.

## Install from npm on Web

```sh
dsh plugin --profile web add aiko-dsh-ontology-kernel@0.1.4 aiko-dsh-bid-studio@0.2.3
dsh --profile web --dump-config
dsh --profile web
```

Published packages contain built host and browser artifacts under `lib/`.

After the profile restarts, open **投标工作台** from the application sidebar. The current demo implementation persists projects and graph records locally, runs deterministic Action adapters in order, pauses for human approval, and exports a reviewable Markdown artifact. The plugin owns this sequencing and records run and step state through the Ontology Kernel. It does not require an active chat Agent or replace the upstream workflow provider. AI-driven Action adapters remain an extension point of the Ontology Kernel.

Install the Kernel only once per profile. Multiple scene plugins can register independent namespaces such as `bid.*` and `contract.*` against that single runtime. The Aiko catalog-aware market installs required platform plugins automatically.
