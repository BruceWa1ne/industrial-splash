  ## 用法

  发布到 npm 后，可以直接这样执行：

  ```bash
  pnpm create industrial-splash my-splash

  或者：

  npm create industrial-splash my-splash

  如果你想把模板名写出来，也可以这样：

  pnpm create industrial-splash my-splash -t workspace

  当前只有一个模板：workspace。

  ## 如何使用

  进入工作区后，先把 logo 放到 branding/logo.png，然后执行：

  npm run splash

  如果你想直接生成固定尺寸，也可以用：

  npm run splash:1280
  npm run splash:1920

  这些脚本不会把 industrial-splash-cli 安装进你的业务项目依赖，而是通过 npx --package industrial-splash-cli 临时执行。

  ## 分工

  现在这套方案分成两个包：

  - create-industrial-splash
  - industrial-splash-cli

  职责：

  - create-industrial-splash：负责创建工作区
  - industrial-splash-cli：负责真正生成 splash 图片