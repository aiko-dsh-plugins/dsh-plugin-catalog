# Aiko 插件市场

在 DeepSeek Harness 中浏览社区和 Aiko 插件，查看说明与截图，并安装、更新或卸载已发布的插件包。

## 安装

在原生插件管理器安装 `aiko-dsh-market@1.38.0`，随后打开“设置 → 插件市场”。已有的 `dshmarket` 必须先移除，因为两个包使用同一配置项。

## 浏览和安装

按名称或说明搜索，并按分类筛选。点击“使用说明”可在市场内阅读中英文指南。Aiko 的说明和截图来自轻量 npm 目录包；浏览 Office 不会下载它的文档运行时。安装使用目录选定的 npm 包和版本。

Bid Studio 依赖 Ontology Kernel。市场计算依赖安装顺序，并阻止卸载仍被其他已安装插件依赖的 Kernel。桌面客户端负责安装确认、激活检查与失败回滚。

## 安装来源

Aiko 市场通过 npm 读取 `aiko-dsh-plugin-catalog`，同时保留社区目录和可选的 GitHub 社区发现。必需目录读取失败会显示错误；可选发现源故障不会禁用 Aiko 目录。

已有 profile 保留已安装的版本和来源。将 GitHub 安装迁往 npm，需要通过原生插件管理器明确重新安装。普通更新不会自动切换发行来源。包迁移保留会话和工作区数据。

## 反馈

[反馈问题](https://github.com/aiko-dsh-plugins/dsh-plugin-catalog/issues)。安装和使用这些插件不需要访问私有开发源码。
