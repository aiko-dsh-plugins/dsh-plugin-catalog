# Aiko Office

Local Word, Excel, PowerPoint and PDF skills for the current DeepSeek Harness agent, with read-only sidebar previews and offline Python runtimes for Windows x64, Apple Silicon and Intel Mac. Document processing uses local libraries; model requests still use the agent's configured provider.

## Install

Install **Aiko Office** on demand through dsh-market or DSH's native plugin manager. Aiko DSH's default installation includes the market; Office is an optional download with its own Python runtimes. The package contributes one Cordis row and is removable through the plugin manager. CLI users can run `dsh plugin --profile web add aiko-dsh-office@0.3.0`. Existing installations retain their Office version until explicitly updated through the plugin manager.

Requires DSH 0.1.5-alpha.2 with its skills service, skill loader, file tools, shell execution and present tool. Windows and macOS automatically select the bundled interpreter matching the Host process architecture; an Intel process under Rosetta uses x64. Other platforms require Python 3.12+ with python/requirements.txt installed. Set aiko-office.pythonPath to override the interpreter. Missing packaged runtimes produce an explicit reinstall error. No document operation downloads dependencies.

## Skills

The plugin registers four packaged skills at DSH's bundled precedence. Project and user skills can override them. Only names and descriptions enter discovery; DSH loads the selected instructions and records them through its existing skill consumer. Each load includes the installed interpreter, common guide, helper and example paths.

| Skill | Workflow |
| --- | --- |
| aiko-office-word | Editable DOCX creation and local edits, Word styles, tables, runs and XML checks |
| aiko-office-excel | Typed XLSX data, editable formulas, formatting, charts and explicit calculation checks |
| aiko-office-powerpoint | Editable PPTX objects, layout, notes, source preservation and geometry checks |
| aiko-office-pdf | PDF generation, extraction, page operations and form verification guidance |

The agent reads the skill, writes a Python script in its workspace, runs it through DSH's existing shell tool, reopens the result, attempts visual verification when supported, and presents the requested file. The package includes independently written Chinese instructions and executable examples using python-docx, openpyxl, xlsxwriter, python-pptx, pypdf and ReportLab. It does not depend on Codex, its artifact-tool library, a second agent or a cloud Skills API.

Version 0.3.0 removes the aiko_office and aiko_office_schema tool registrations. Calls from older conversations or integrations to those names must be replaced with skill loading and script execution; an unfinished old tool call is not automatically migrated. The existing bounded worker remains an implementation helper for structural reads and regression fixtures, not a model-facing tool.

## Execution and verification

The existing DSH shell owns process lifetime, timeout, cancellation, credential scrubbing and session sandbox enforcement. Scripts are model-authored code and have the same permissions as other shell commands. The former structured tool's per-operation path restrictions, atomic output policy and Office-specific timeout settings do not apply to arbitrary scripts. Skills and examples preserve inputs and use new output filenames; DSH policy remains the enforcement layer.

python/office.py inspect reads bounded workspace-local structure, with --sheet/--range for Excel and --offset/--limit for paginated content. Its defaults are 50 MiB input, 256 MiB expanded OOXML, 2,000 items and 256 KiB result. It does not prove layout or recalculate formulas.

python/office.py render uses optional local LibreOffice and Poppler, accepts explicit --soffice and --pdftoppm executable paths, and writes into a new workspace directory. It reports missing engines without claiming visual QA. Rendering is limited to a requested page interval (1–30 by default, at most 100 per invocation); inspect every relevant page and render further intervals when needed. These engines are not bundled. Rendering an XLSX through another engine does not prove that the original XLSX caches were updated.

Only pythonPath remains an Office setting; changed values apply on the next skill load. Reload the skill after changing that setting. Timeout and permission choices belong to the shell. The former Office worker-limit settings are obsolete.

## Document Preview

The client registers Word, Excel and PowerPoint viewers in DSH's sidebar; PDF uses DSH's built-in viewer. Previews load local document bytes in a sandboxed iframe. No Office installation or cloud viewer is required. Renderers and their licenses ship in the plugin.

Word previews pages, tables and images. Excel offers worksheets and windows of 200 rows by 50 columns, with styles, merged cells and separately displayed images. PowerPoint renders individual slides. Preview is read-only: Excel charts and conditional formatting are not displayed and formulas are not recalculated. Fonts and complex Office layouts can differ from native applications. Opening a preview is not evidence that the model inspected it.

Files are limited to 50 MiB; preview archives are limited to 10,000 entries, 64 MiB per entry and 256 MiB expanded. PowerPoint also applies its renderer's ZIP limits. Viewer state and temporary URLs are released on close or reload.

## Limits

Neither openpyxl nor xlsxwriter evaluates Excel formulas. Skills require checks of formula references and independent expected results, and disclosure when engine recalculation was not performed. LibreOffice/Poppler rendering, OCR, installed Office window automation, guaranteed macro/animation fidelity and a visual editor are not bundled capabilities. PDF page editing does not rewrite existing paragraphs. Advanced document operations need targeted file and object checks; a successfully saved file alone is insufficient.
