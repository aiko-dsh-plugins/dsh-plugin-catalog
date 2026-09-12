# Aiko Office

Local Word, Excel, PowerPoint and PDF tools for the current DeepSeek Harness agent. No Claude account, additional model, or document upload is involved. The release includes Python and all document libraries for Windows x64, Apple Silicon and Intel Mac, so installing the published package from a prepared Desktop seed requires no network or system Python.

## Install

Install **Aiko Office** from the Aiko organization catalog in dsh-market. Official Electron owns the package transaction and restarts its backend after activation. The package is removable through the native plugin manager. CLI users can add the published bundle with `dsh plugin --profile web add aiko-dsh-office@0.2.2`.

Requires DSH 0.1.5-alpha.2. Windows x64 and macOS arm64/x64 automatically select the bundled runtime matching the Host process architecture. An Intel DSH running under Rosetta uses the x64 runtime. Other platforms require a local Python 3.12+ with `python/requirements.txt` installed, selected through `aiko-office.pythonPath`. A missing bundled interpreter produces an explicit reinstall error. No runtime downloads or package installation occur during a document operation. Desktop preinstallation retains user removals and does not force this plugin into existing profiles on upgrade.

## Model Experience

`aiko_office_schema` returns the supported document fields, operation examples and limitations for one format. `aiko_office` reads, creates or edits files using structured data; it executes no model-provided code. The agent should read back its result, then use the existing DSH `present` tool to deliver the file. Tool calls and results use the normal DSH session log and tool presentation. DSH's configured model still requires its own normal model access; only document processing is offline.

| Format | Operations |
| --- | --- |
| Word `.docx` | Create headings, formatted runs, paragraphs, tables, embedded images, headers, footers and margins; read paragraph/table content; replace literal text, edit paragraphs/table cells, append content. |
| Excel `.xlsx` | Read bounded ranges; create sheets, scalar cells, formulas, styles, frozen panes and bar/line/pie charts; edit ranges, rename/add sheets, embed images. |
| PowerPoint `.pptx` | Create editable text boxes, images, tables, backgrounds and notes; read shape IDs and positions; replace text, edit notes/text shapes, append slides and images. |
| PDF `.pdf` | Create text/table reports, extract text, select/reorder/rotate pages and append PDFs. |

All paths and images must resolve inside the session workspace. Output directories must already exist. Creates and edits require a new output path: originals are preserved and existing destinations are refused. The worker validates file size and OOXML expansion limits, processes files in memory, and atomically publishes complete new files. The process is managed by DSH, inherits its scrubbed environment, honors the session sandbox, and is terminated on cancellation, timeout or plugin unload.

## Settings

The `aiko-office` namespace accepts `pythonPath` (empty selects bundled Windows/macOS Python, or `python3` on other platforms), `timeoutMs` (120000), `graceMs` (2000), `maxFileBytes` (52428800), `maxArchiveBytes` (268435456), `maxResultBytes` (262144), and `maxItems` (2000). Saved settings take effect on the next call. The plugin adds no credentials or separate settings page. Edit the namespace through DSH's settings document when changing advanced limits.

## Document Preview

Version 0.1.1 registers Word, Excel and PowerPoint viewers in the official DSH sidebar. Open a presented `.docx`, `.xlsx` or `.pptx` file to use the matching viewer. Word displays pages, tables and images with fit-width or fixed zoom. Excel displays worksheet tabs through a selector, styled and merged cells, number formats, formula text or cached results, and embedded images below the grid; row and column controls access the entire used range in windows of 200 rows by 50 columns. PowerPoint renders one slide at a time with previous/next controls and direct slide selection. PDF continues using DSH's built-in viewer.

All renderer code ships inside the plugin. Previews use complete bytes from DSH's session file reader and an opaque sandboxed iframe that denies network access, forms and parent-page access. No Office installation or cloud viewer is required. Renderer state and temporary URLs are discarded when the preview closes or reloads. The preview accepts files up to 50 MiB and rejects archives exceeding 10,000 entries, 64 MiB per entry or 256 MiB total expanded size; DSH's file-reader limit can reject a file earlier. PowerPoint additionally uses its renderer's recommended ZIP limits.

Preview is read-only. Spreadsheet charts and conditional formatting are not rendered, formula results are not recalculated, and images are shown separately rather than at cell anchors. Fonts must exist locally; complex Office layout, animation, embedded objects and EMF/WMF PDF fallbacks may differ or be absent. The sidebar's reload action rereads externally modified files.

## Limits

Excel formulas are written but not recalculated. The workbook requests automatic calculation when opened by Excel; cached values are not current calculation evidence. Complex Excel extensions, macros, old `.doc/.xls/.ppt` files, encrypted PDFs, scanned-page OCR and automatic Office-to-PDF rendering are outside this release. PDF editing changes pages, not existing paragraph text. Word replacements cover ordinary paragraph runs, tables, headers and footers; drawings, fields and hyperlinks require other tooling. PowerPoint text-shape replacement resets that shape's run formatting, and advanced animations/master fidelity is not guaranteed. This plugin manipulates files; it does not automate installed Microsoft Office windows or add an embedded Office editor.
