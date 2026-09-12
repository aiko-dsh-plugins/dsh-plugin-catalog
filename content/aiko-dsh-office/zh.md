# Aiko Office

让当前 DeepSeek Harness Agent 在本地读取、创建和编辑 Word、Excel、PowerPoint 与 PDF，并在侧栏预览文档。文档处理不需要 Claude 账号、额外模型或上传文档；DSH 使用的模型仍需正常的模型服务访问。

## 安装

在插件市场选择 Aiko Office。当前包为 `aiko-dsh-office@0.2.2`，要求 DSH 0.1.5-alpha.2。桌面客户端负责安装事务和后端激活；可通过原生插件管理器卸载。

Windows x64、Apple Silicon 和 Intel Mac 自带 Python 与文档库，按宿主进程架构选择。Rosetta 下的 Intel DSH 使用 x64 运行时。其他平台需要 Python 3.12+ 和包内 `python/requirements.txt` 的依赖，并通过 `aiko-office.pythonPath` 指定解释器。执行文档操作时不会下载运行时或安装依赖。

## 文档操作

| 格式 | 支持的操作 |
| --- | --- |
| Word `.docx` | 创建标题、段落、格式化文字、表格、图片、页眉页脚；读取内容；替换文字、修改段落和单元格、追加内容。 |
| Excel `.xlsx` | 读取指定范围；创建工作表、单元格、公式、样式、冻结窗格和柱状/折线/饼图；修改范围、重命名或添加工作表、嵌入图片。 |
| PowerPoint `.pptx` | 创建可编辑文本框、图片、表格、背景和备注；读取形状编号与位置；替换文字、修改备注、追加幻灯片。 |
| PDF `.pdf` | 创建文字和表格报告、提取文字、选择/排序/旋转页面、合并 PDF。 |

Agent 通过 `aiko_office_schema` 查询某种格式的字段和示例，再通过 `aiko_office` 操作文件，检查结果后用 DSH 的文件展示能力交付。工具接收结构化数据，不执行模型生成的代码。调用与结果使用 DSH 的会话记录和工具展示。

文件和图片必须位于当前会话工作区。输出目录须已存在；创建和编辑必须写入新的路径，保留原件，拒绝覆盖已有目标。操作遵守文件大小、解压大小、超时和沙箱限制；取消、超时或卸载插件会结束相关子进程。

## 侧栏预览

打开已展示的 `.docx`、`.xlsx`、`.pptx` 即可预览，无需安装 Microsoft Office。Word 支持页面和缩放；Excel 支持工作表切换、样式、合并单元格、公式文字或缓存值，并以每次 200 行、50 列访问使用范围；PowerPoint 支持逐页和直接选页。PDF 使用 DSH 内置预览器。

预览为只读，使用本地文件字节和禁止联网的隔离 iframe。文件最多 50 MiB；压缩包最多 10,000 个条目，单项最多 64 MiB，展开总量最多 256 MiB；DSH 文件读取限制可能更早拒绝文件。关闭或重载时释放临时资源。

## 设置与限制

`aiko-office` 设置包括 `pythonPath`、`timeoutMs`、`graceMs`、`maxFileBytes`、`maxArchiveBytes`、`maxResultBytes`、`maxItems`，保存后下次调用生效。

Excel 公式不会重新计算；缓存值不是计算结果的验证依据。预览不渲染 Excel 图表和条件格式，图片单独显示。暂不支持宏、旧 `.doc/.xls/.ppt` 格式、加密 PDF、扫描 OCR 或自动 Office 转 PDF。PDF 编辑操作页面而非原有段落；复杂排版、字体、动画和嵌入对象可能不完全还原。此插件不控制 Microsoft Office 窗口，也不提供内嵌 Office 编辑器。
