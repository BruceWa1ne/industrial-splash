# create-industrial-splash

用于创建一个独立的 `industrial-splash-cli` 工作区。

创建后目录里会包含：

- `industrial-splash.config.json`
- `branding/README.txt`
- `package.json`
- `README.md`
- `.gitignore`

## 用法

发布到 npm 后，可以直接这样执行：

```bash
pnpm create industrial-splash my-splash
```

或：

```bash
npm create industrial-splash my-splash
```

当前只提供一个模板：

```bash
pnpm create industrial-splash my-splash -t workspace
```

## 创建后的使用方式

进入工作区后，把 logo 放到 `branding/logo.png`，然后执行：

```bash
npm run splash
```

或：

```bash
npm run splash:1280
npm run splash:1920
```

这些脚本不会把 `industrial-splash-cli` 安装进你的业务项目依赖，而是通过 `npx --package industrial-splash-cli` 临时执行。

## 发布顺序

这个脚手架生成出来的工作区，会在脚本里调用 `industrial-splash-cli`。

因此发布时顺序应为：

1. 先发布 `industrial-splash-cli`
2. 再发布 `create-industrial-splash`
