# Aiko 投标工作台

在 DSH 侧栏提供投标工作台，包含投标本体定义、对象和关系、Function 与 Action、本地执行步骤、人工审核和导出，以及本体检查器。

## 安装

当前包为 `aiko-dsh-bid-studio@0.2.3`，要求 DSH 0.1.5-alpha.2，并依赖 `aiko-dsh-ontology-kernel@0.1.4`。在 Aiko 插件市场选择 Bid Studio，市场先安装 Kernel，再交给桌面客户端一并激活。桌面安装需要 Aiko 市场配套的原生桥接接口。

Web profile 可以通过下列命令安装：

```sh
dsh plugin --profile web add aiko-dsh-ontology-kernel@0.1.4 aiko-dsh-bid-studio@0.2.3
```

## 使用

profile 激活后，从侧栏打开“投标工作台”。当前演示实现将项目和图数据持久化在本地，按顺序运行确定性的 Action 适配器，在人工审核步骤暂停，并导出可审阅的 Markdown 文件。

执行步骤由插件管理，通过 Kernel 保存运行和步骤状态，不要求已有聊天 Agent，也不替代 DSH 的工作流提供者。AI 驱动的 Action 可以通过 Kernel 的扩展接口接入。

## 本体依赖

Bid Studio 提供 `bid.*` 业务定义、工具、适配器和工作台。Kernel 提供共享本体运行时、持久化存储和浏览器远程接口。每个 profile 只需安装一次 Kernel，多个业务插件可以注册各自的命名空间。
