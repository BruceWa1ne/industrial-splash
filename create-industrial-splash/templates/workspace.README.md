# {{workspaceName}}

这是一个独立的工业屏 splash 工作区。

## 目录说明

- `branding/logo.png`：放你的 logo
- `industrial-splash.config.json`：生成配置
- `output/`：生成结果

## 使用方法

先把 logo 放到 `branding/logo.png`，然后执行：

```bash
npm run splash
```

如果要直接指定分辨率：

```bash
npm run splash:1280
npm run splash:1920
```

## 说明

这里不会把 `industrial-splash-cli` 安装到你的业务项目依赖中，而是通过 `npx --package industrial-splash-cli` 临时执行。
