# Aiko 本体运行时

为业务插件提供共享的本体定义、对象、关系、Function 与 Action，以及持久化图存储和类型化浏览器远程接口。

## 安装

在市场安装 `aiko-dsh-ontology-kernel@0.1.4`。安装 Bid Studio 时，市场会自动将 Kernel 纳入依赖安装。每个 profile 只需一个 Kernel。

Web profile 可以通过下列命令安装：

```sh
dsh plugin --profile web add aiko-dsh-ontology-kernel@0.1.4
```

## 插件接口

业务插件从 `aiko-dsh-ontology-kernel/runtime` 导入本体类型，通过 `ctx.ontology.register(...)` 注册有版本的对象类型、关系类型、Function、Action 和实现。浏览器插件使用 `ctx.ontologyRemote`，无需直接依赖本地存储实现。

安装包先插入 `ontology-local`，再插入 `ontology-remote`。后续 profile 配置可更换其中一个适配器，业务插件接口保持不变。

## 使用限制

Kernel 提供基础能力，本身不包含投标、合同或项目业务工作台。卸载前需先处理依赖它的业务插件；市场会阻止破坏已安装插件依赖的卸载操作。
