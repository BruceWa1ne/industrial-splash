# industrial-splash-cli 发布与使用说明

## 1. 包的定位

`industrial-splash-cli` 是一个命令行工具包，用来为固定分辨率的工控横屏设备生成启动图。

当前只支持两套横屏分辨率：

- `1280x800`
- `1920x1080`

它不是运行时依赖，也不是安装到 uni-app 页面里的组件包。它的职责是：

- 读取一张 logo 图
- 按配置生成 splash 图片
- 按需导出到 Android `res` 目录

## 2. 在当前仓库里如何使用

你当前所在目录是：

```text
C:\Users\BruceWa1ne\Desktop\projects\Industrial-Computer
```

### 2.1 安装 CLI 自己的依赖

在仓库根目录执行：

```bash
pnpm --dir .\scripts\industrial-splash-cli install
```

### 2.2 在当前项目根目录初始化配置

仍然在仓库根目录执行：

```bash
node .\scripts\industrial-splash-cli\cli.mjs --init
```

执行后会在当前目录生成：

- `industrial-splash.config.json`
- `branding/README.txt`

如果你不想污染当前项目，建议直接把配置初始化到项目外的独立工作目录，例如：

```bash
node .\scripts\industrial-splash-cli\cli.mjs --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --init
```

这样生成的配置和 `branding` 目录都会落在：

```text
C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace
```

### 2.3 放置 logo

把你的 logo 放到：

```text
C:\Users\BruceWa1ne\Desktop\projects\Industrial-Computer\branding\logo.png
```

建议使用透明底 PNG。

### 2.4 生成启动图

交互式选择分辨率：

```bash
node .\scripts\industrial-splash-cli\cli.mjs
```

直接指定分辨率：

```bash
node .\scripts\industrial-splash-cli\cli.mjs --target 1280x800
```

如果你是把一个 logo 文件直接拖进终端，希望临时处理，不改配置文件里的 `logoPath`，可以这样执行：

```bash
node .\scripts\industrial-splash-cli\cli.mjs --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --logo "C:\Users\BruceWa1ne\Desktop\logo.png" --output-dir C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\output --target 1280x800
```

这样输入文件和输出文件都在外部工作目录，不会污染当前仓库。

### 2.5 导出到 Android 原生工程

如果你要把结果额外导出到某个 Android 工程的 `res` 目录：

```bash
node .\scripts\industrial-splash-cli\cli.mjs --target 1920x1080 --android-res-dir C:\path\to\app\src\main\res
```

## 3. 发布到 npm 后如何使用

如果包已经成功发布到 npm，使用方式就会变成标准 CLI 包方式。

### 3.1 临时执行

```bash
npx industrial-splash --init
npx industrial-splash
```

### 3.2 安装到项目里

用 npm：

```bash
npm install industrial-splash-cli
```

用 pnpm：

```bash
pnpm add industrial-splash-cli
```

安装后执行：

```bash
npx industrial-splash --init
npx industrial-splash --target 1280x800
```

如果你不想在当前项目生成任何配置或输出，推荐直接用外部工作目录：

```bash
npx industrial-splash --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --init
npx industrial-splash --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --logo "C:\Users\BruceWa1ne\Desktop\logo.png" --output-dir C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\output --target 1920x1080
```

如果你希望把它挂到 `package.json` 脚本里，可以写成：

```json
{
  "scripts": {
    "splash:init": "industrial-splash --init",
    "splash:1280": "industrial-splash --target 1280x800",
    "splash:1080": "industrial-splash --target 1920x1080"
  }
}
```

## 3.1 未发布到 npm 前，如何临时用 npx 调本地包

如果这个包还没正式发布到 npm，但你又不想把它安装到当前业务项目里，可以直接让 `npx` 临时执行本地包。

例如，本地包目录如果放在：

```text
C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-cli
```

那你可以这样初始化外部工作目录：

```bash
npx --cache C:\Users\BruceWa1ne\Desktop\projects\npm-cache --yes --package C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-cli industrial-splash -- --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --init
```

然后这样生成：

```bash
npx --cache C:\Users\BruceWa1ne\Desktop\projects\npm-cache --yes --package C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-cli industrial-splash -- --config C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\industrial-splash.config.json --logo "C:\Users\BruceWa1ne\Desktop\logo.png" --output-dir C:\Users\BruceWa1ne\Desktop\projects\industrial-splash-workspace\output --target 1280x800
```

这里专门带 `--cache`，是为了把 npx 的临时缓存也放在 `C:\Users\BruceWa1ne\Desktop\projects` 下，避免写到别的目录。

## 4. 输出目录分别是什么意思

生成结果默认输出到：

```text
output/<target>/
```

例如：

```text
output/1280x800/
```

这个目录下当前会有三类结果。

### 4.1 `preview/splash.png`

这是预览图。

作用：

- 方便你直接查看视觉效果
- 方便设计或产品确认 logo 大小、位置、留白和背景色
- 不依赖 Android 目录结构，普通图片查看器就能打开

它更偏向“人工验收图”，不是专门给 Android 资源系统用的目录名称。

### 4.2 `android-res/drawable-nodpi/splash.png`

这是 Android 通用兜底资源。

含义：

- `drawable` 表示图片资源目录
- `nodpi` 表示不要按屏幕密度自动缩放

作用：

- 作为没有方向限定时的兜底 splash 图
- 某些场景下，如果系统或工程没有命中更具体的方向资源，可以回退到这里

可以把它理解成“默认版本”。

### 4.3 `android-res/drawable-land-nodpi/splash.png`

这是 Android 横屏专用资源。

含义：

- `land` 表示 landscape，也就是横屏
- `nodpi` 表示不按密度自动缩放

作用：

- 当设备处于横屏时，Android 资源匹配会优先命中这个目录
- 对你当前工控屏场景，这是实际更有针对性的那份 splash 图

可以把它理解成“横屏版本”。

## 5. `drawable-nodpi` 和 `drawable-land-nodpi` 为什么要同时存在

原因是它们承担的职责不同：

- `drawable-nodpi` 是默认兜底资源
- `drawable-land-nodpi` 是横屏优先资源

当前这个工具虽然只服务横屏工控屏，但仍然同时输出这两份，目的是让 Android 工程接入时更稳，不把资源命中完全压在单个目录上。

如果你的原生工程已经明确只吃横屏限定目录，也可以只使用 `drawable-land-nodpi/splash.png`。

## 6. 后续 npm 发布流程

下面这部分是你以后每次发版时可以直接照做的流程。

### 6.1 首次发布前检查

进入包目录：

```bash
cd C:\Users\BruceWa1ne\Desktop\projects\Industrial-Computer\scripts\industrial-splash-cli
```

检查包名是否存在：

```bash
npm view industrial-splash-cli name version
```

如果返回 `E404 Not Found`，通常表示这个包当前还不存在。

确认登录状态：

```bash
npm whoami
```

没有登录就执行：

```bash
npm login
```

执行发布前检查：

```bash
npm install
npm run pack:check
npm run release:check
```

说明：

- `pack:check` 会检查最终 tarball 里包含哪些文件
- `release:check` 会模拟一次 `npm publish`

### 6.2 首次发布

如果继续使用当前非 scoped 包名：

```bash
npm publish
```

如果 npm 要求 2FA，就先在 npm 网站开启 2FA，然后重新：

```bash
npm logout
npm login
npm publish
```

### 6.3 如果包名冲突，改用 scoped 包

例如改成：

```json
{
  "name": "@your-npm-username/industrial-splash-cli"
}
```

然后发布：

```bash
npm publish --access public
```

或者使用当前包里已经准备好的脚本：

```bash
npm run publish:public
```

### 6.4 后续发新版本

改完代码后先升级版本号：

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

如果是 scoped 包，就执行：

```bash
npm run publish:public
```

### 6.5 发布成功后验证

查看线上版本：

```bash
npm view industrial-splash-cli version
```

或打开网页：

```text
https://www.npmjs.com/package/industrial-splash-cli
```
