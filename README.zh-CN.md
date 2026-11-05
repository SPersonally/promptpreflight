# PromptPreflight｜发给 AI 之前的隐私检查

**把工作资料、代码、日志发给 ChatGPT / Claude / Gemini 之前，先检查有没有不该泄露的信息。**

这是一个可直接开源的轻量工具。它不需要登录、不需要 AI API Key，也不需要后端：在本地浏览器中扫描文本，并用占位符替换常见敏感信息。

[English README](./README.md)

## 它解决什么问题？

我们经常把报错日志、项目代码、客户反馈发给 AI，让 AI 帮忙调试、总结或写文档。但这些内容里可能夹带：

- API Key、GitHub Token、JWT、密码、私钥；
- 客户邮箱、手机号、身份证号；
- 内网 IP、钱包地址；
- 不方便公开的客户名、内部项目代号。

PromptPreflight 会在发给 AI 之前执行一遍本地检测。**同一个敏感值多次出现，会被替换为同一个标记**，这样 AI 仍能理解人物与数据之间的关系。

它不是 AI 模型，也不能替代专业安全审计；它是专门服务 AI 使用场景的隐私辅助工具。

## 核心功能

1. **左右对照：** 左侧粘贴原文，右侧实时输出脱敏结果。
2. **10 组内置检测：** 常见 API Key、JWT、私钥、密码、带密码的 URL、邮箱、手机号、身份证号、EVM 地址和 IPv4。
3. **自定义敏感词：** 可以手动添加客户名称、内部项目代号。
4. **可选规则：** 哪些信息需要隐藏，由自己勾选。
5. **一键复制或下载：** 直接拿脱敏内容去问 AI。
6. **中英双语、手机可用：** 不依赖付费服务。
7. **本地命令行：** 方便开发者检查文本文件、接入 CI。

## 本地运行（最简单）

电脑上安装 Node.js 20 或更新版本。项目不需要安装额外依赖。

~~~sh
npm start
~~~

浏览器打开：**http://127.0.0.1:4173**

点击页面上的“载入示例”，马上就能看到检测效果。

### 命令行示例

~~~sh
# 只检查有没有匹配项，不展示原始秘密
node bin/cli.mjs --input draft.txt --check

# 保存脱敏副本，保留原始文件不变
node bin/cli.mjs --input draft.txt --out safe.txt

# 跑自动测试
npm test
~~~

## 上传 GitHub 的方法

1. GitHub 首页右上角点击 **+ → New repository（新建仓库）**。
2. Repository name 填写 **promptpreflight**，选择 **Public**。
3. 点击 **Create repository**。
4. 进入新仓库，选择 **uploading an existing file** 或 **Add file → Upload files**。
5. 把本项目 ZIP **先解压**，再把其中所有文件和文件夹上传，包括隐藏的 .github 文件夹。
6. 点击最下方的 **Commit changes**。

注意：GitHub 网页上传时，如果遗漏了隐藏的 .github 文件夹，网站仍能运行，只是自动测试工作流不会出现。建议使用 GitHub Desktop 或 git 命令上传，以保留所有文件。

### 让网页直接在线访问（免费）

进入仓库 **Settings → Pages → Build and deployment**，选择：

- Source：Deploy from a branch
- Branch：main
- Folder：/(root)

保存后就能使用类似地址：

https://YOUR_USERNAME.github.io/promptpreflight/

把 YOUR_USERNAME 换成你自己的 GitHub 用户名。如果你用的是 teleiqing，就是：

https://teleiqing.github.io/promptpreflight/

> 上述网址需要先创建仓库并开启 GitHub Pages 才会生效。

## 隐私与安全说明

- 输入的文本不上传到项目服务器；检测逻辑在浏览器本地执行。
- 工具没有用户账号、数据分析、第三方 AI 调用或云数据库。
- 内置规则无法识别所有类型的敏感信息，也可能误报。
- 检测到 0 项不代表绝对安全。把内容发给 AI 前仍要人工检查。
- 如果某个密钥已经被公开，应立即在对应平台将其撤销和重置。

## 开源方式

本项目采用 **MIT 开源许可证**。欢迎其他开发者提交 Issue、改进规则和补充测试。

真正获得 GitHub Stars 靠的是项目解决了多少人的问题，公开代码本身不会自动带来 Stars。
