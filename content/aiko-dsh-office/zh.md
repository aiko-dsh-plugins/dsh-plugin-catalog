# Aiko Office

为当前 DeepSeek Harness Agent 提供 Word、Excel、PowerPoint 和 PDF 四套本地 Skills、可运行示例、只读文档预览，以及 Windows x64、Apple Silicon 和 Intel Mac 的离线 Python。文档处理使用本地库，模型请求仍使用 DSH 配置的服务。

## 安装与升级

在插件市场选择 Aiko Office，安装 `aiko-dsh-office@0.3.0`。也可运行 `dsh plugin --profile web add aiko-dsh-office@0.3.0`。Aiko DSH 默认只预装市场，Office 由用户按需安装；已安装的旧版需要通过插件管理器主动更新。插件可以卸载。

要求 DSH 0.1.5-alpha.2，具备技能服务、技能加载、文件读写、脚本执行和文件交付工具。Windows 和 macOS 自动选择与宿主进程架构匹配的随包 Python；Rosetta 下的 Intel 进程使用 x64 运行时。其他平台需要 Python 3.12+ 和包内 `python/requirements.txt` 的依赖。可通过 `aiko-office.pythonPath` 指定解释器。缺少随包运行时会明确提示重新安装，文档操作期间不下载依赖。

## 四套 Skills

| Skill | 用途 |
| --- | --- |
| `aiko-office-word` | 创建和修改可编辑 DOCX，处理样式、表格、文字格式及 XML 检查。 |
| `aiko-office-excel` | 创建和修改 XLSX，处理数据类型、公式、样式、图表及计算核对。 |
| `aiko-office-powerpoint` | 创建和修改可编辑 PPTX，处理布局、备注、源文件保留及对象位置检查。 |
| `aiko-office-pdf` | 生成、提取、合并和调整 PDF 页面，并提供原生表单检查方法。 |

发现阶段只提供技能名称和描述，模型按需加载具体说明，DSH 负责记录。项目和用户同名技能可以覆盖随包技能。每次加载都会提供当前安装位置中的 Python、公共指南、辅助脚本和示例路径。

工作流程是：读取 Skill 和公共指南，在工作区编写 Python 脚本，通过 DSH 现有 Shell 执行，重新打开结果检查，在支持时渲染并检查图片，最后通过 `present` 交付文件。技能和示例为独立编写的中文内容，使用 python-docx、openpyxl、xlsxwriter、python-pptx、pypdf 和 ReportLab；不依赖 Codex、artifact-tool、第二个 Agent 或云端 Skills API。

**0.3.0 移除了 `aiko_office` 和 `aiko_office_schema` 两个专用工具。** 旧会话或集成中对这两个名称的调用需要改为技能加载和脚本执行，未完成的旧工具调用不会自动迁移。原有 worker 仅用于结构读取和回归用例。

## 执行、检查与设置

脚本由模型编写，权限、沙箱、超时、取消及进程清理由 DSH 现有 Shell 管理。旧专用工具的每次操作路径限制、原子输出策略和 Office 超时设置不约束任意脚本。Skills 和示例要求保留原件、使用新输出文件名，实际权限由 DSH 策略控制。

`python/office.py inspect` 读取工作区内的文档结构，Excel 可用 `--sheet` 和 `--range`，分页内容可用 `--offset` 和 `--limit`。默认限制为 50 MiB 输入、256 MiB OOXML 展开量、2,000 项及 256 KiB 结果。结构读取不证明排版正确，也不重算公式。

`python/office.py render` 可调用本机已有的 LibreOffice 和 Poppler，支持 `--soffice`、`--pdftoppm` 路径，输出到新的工作区目录。这些渲染器不随包附带；缺少时明确报告。默认渲染第 1–30 页，每次最多 100 页；需要检查全部相关页面，不能把成功生成图片等同于完成视觉检查。渲染 XLSX 也不证明原工作簿的公式缓存已更新。

Office 设置仅保留 `pythonPath`，修改后需重新加载技能。超时和权限设置属于 Shell，旧 Office worker 限制项已废弃。

## 侧栏预览

打开已交付的 DOCX、XLSX 或 PPTX，使用 DSH 侧栏的只读查看器；PDF 使用内置查看器。渲染代码和许可证随包提供，使用本地文件字节及隔离 iframe，无需 Microsoft Office 或云端查看器。

Word 支持页面、表格、图片和缩放。Excel 支持工作表切换、样式、合并单元格，按每次 200 行、50 列访问内容，并单独显示图片。PowerPoint 支持逐页预览。Excel 图表和条件格式不显示，公式不重算；字体和复杂排版可能与原生 Office 不同。打开侧栏不代表模型已看过图片。

预览文件最多 50 MiB；压缩包最多 10,000 个条目，单项最多 64 MiB，展开总量最多 256 MiB。PowerPoint 另有渲染器自身的 ZIP 限制。关闭或重载时释放临时资源。

## 能力限制

openpyxl 和 xlsxwriter 不执行公式。技能要求核对引用与独立计算的预期结果，并明确说明是否运行过公式引擎。LibreOffice、Poppler、OCR、Microsoft Office 窗口控制和可视化编辑器不随包提供，也不保证宏、动画及复杂扩展对象完全保真。PDF 页面操作不会改写原有段落。成功保存文件不足以证明任务完成，仍需针对内容和对象检查。
