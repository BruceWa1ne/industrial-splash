# industrial-splash-cli

用于固定分辨率工控横屏设备的启动图生成 CLI。

当前版本只面向这两套横屏分辨率：

- `1280x800`
- `1920x1080`

它的定位很明确：

- 输入一张透明底 logo
- 生成预览图
- 按需导出 Android `res` 资源

不做通用手机竖屏自适配，也不默认绑定某个具体 Android 工程目录。

## 安装

```bash
npm install industrial-splash-cli
```

或：

```bash
pnpm add industrial-splash-cli
```

如果只是临时执行，也可以直接用：

```bash
npx industrial-splash --help
```

## 初始化配置

在你的项目目录执行：

```bash
npx industrial-splash --init
```

会生成：

- `industrial-splash.config.json`
- `branding/README.txt`

如果需要覆盖已有文件：

```bash
npx industrial-splash --init --force
```

如果你不想在当前项目里生成配置，也可以把配置初始化到外部工作目录：

```bash
npx industrial-splash --config ../industrial-splash-workspace/industrial-splash.config.json --init
```

这样会把以下文件生成到 `../industrial-splash-workspace/`：

- `industrial-splash.config.json`
- `branding/README.txt`

## 生成启动图

交互式选择分辨率：

```bash
npx industrial-splash
```

跳过交互，直接指定目标分辨率：

```bash
npx industrial-splash --target 1280x800
```

如果你希望临时拖入一个 logo 文件处理，而不修改配置里的 `logoPath`，可以直接覆盖：

```bash
npx industrial-splash --config ../industrial-splash-workspace/industrial-splash.config.json --logo "C:/Users/name/Desktop/logo.png" --output-dir ../industrial-splash-workspace/output --target 1280x800
```

## 导出到 Android res

默认只写入当前项目的 `output` 目录。

如果你还想额外导出到 Android 原生工程的 `res` 目录：

```bash
npx industrial-splash --target 1920x1080 --android-res-dir ./app/src/main/res
```

会额外生成：

- `drawable-nodpi/splash.png`
- `drawable-land-nodpi/splash.png`

## 输出结构

默认输出目录为 `output/<target>/`：

- `preview/splash.png`
- `android-res/drawable-nodpi/splash.png`
- `android-res/drawable-land-nodpi/splash.png`

## 配置说明

`industrial-splash.config.json` 字段说明：

- `logoPath`：logo 图片路径
- `backgroundColor`：背景色
- `outputDir`：输出目录
- `androidQualifier`：Android 方向限定符，默认 `land`
- `renderDefaults.logoMaxWidthRatio`：logo 最大宽度占比
- `renderDefaults.logoMaxHeightRatio`：logo 最大高度占比
- `renderDefaults.offsetX`：水平方向偏移
- `renderDefaults.offsetY`：垂直方向偏移
- `targets`：固定分辨率列表

## 本地开发

在包目录执行：

```bash
npm install
npm run pack:check
npm run release:check
```

说明：

- `pack:check` 用于检查最终打包内容
- `release:check` 用于模拟 `npm publish` 前的发布校验

## 发布到 npm

### 发布前检查

先进入包目录：

```bash
cd scripts/industrial-splash-cli
```

确认包名是否可用：

```bash
npm view industrial-splash-cli name version
```

如果返回 `E404 Not Found`，通常表示这个包名当前不存在，可以继续发布。

确认你已经登录 npm：

```bash
npm whoami
```

如果还没登录：

```bash
npm login
```

执行发布前检查：

```bash
npm install
npm run pack:check
npm run release:check
```

### 首次发布

如果继续使用当前非 scoped 包名：

```bash
npm publish
```

如果你后面改成 scoped 包名，例如：

```json
{
  "name": "@your-npm-username/industrial-splash-cli"
}
```

那就发布为公开包：

```bash
npm publish --access public
```

当前包已经带了：

- `publishConfig.access = public`
- `npm run publish:public`

所以 scoped 包也可以直接执行：

```bash
npm run publish:public
```

### 后续发新版本

修改代码后，先升级版本号：

```bash
npm version patch
```

也可以按需要使用：

```bash
npm version minor
npm version major
```

然后重新发布：

```bash
npm publish
```

或：

```bash
npm run publish:public
```

### 发布成功后验证

发布完成后，可以在 npm 网站查看：

```text
https://www.npmjs.com/package/industrial-splash-cli
```

或执行：

```bash
npm view industrial-splash-cli version
```
