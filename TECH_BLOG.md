# 一个 Node.js 初学者的图片识别项目实践

最近我做了一个小项目：上传一张图片，然后让网页告诉我图片里大概有什么。项目不算大，但对我这种 Node.js / Next.js 初学者来说，里面刚好包含了很多真实开发中会遇到的小问题。

这篇文章简单记录一下这个项目是怎么做的，以及中间踩到的几个坑。

## 项目是做什么的

这个项目叫“图片识别助手”。

它的功能很简单：

1. 用户在网页里上传一张图片。
2. 页面先显示图片预览。
3. 点击“开始识别”按钮。
4. 前端把图片发给后端接口。
5. 后端调用百度智能云的图片识别 API。
6. 页面展示识别结果。

技术栈主要是：

- Next.js
- React
- TypeScript
- Tailwind CSS
- 百度智能云图片识别接口

## 项目结构

项目结构大概是这样：

```text
image-recognition/
├── app/
│   ├── api/
│   │   └── recognize/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env.local
├── package.json
└── tsconfig.json
```

其中最重要的是两个文件：

- `app/page.tsx`：网页部分，负责上传图片、显示预览、展示识别结果。
- `app/api/recognize/route.ts`：接口部分，负责调用百度图片识别服务。

因为用的是 Next.js，所以前端页面和后端 API 可以放在同一个项目里，这点对初学者来说挺友好的，不用一开始就拆成两个项目。

## 前端做了什么

前端页面主要做三件事：

第一，选择图片。

用户上传图片后，页面会用 `URL.createObjectURL` 生成一个本地预览地址，这样不用等接口返回，就能先看到自己选了哪张图。

第二，把图片转成 Base64。

浏览器里可以用 `FileReader` 读取图片文件：

```ts
const reader = new FileReader();
reader.readAsDataURL(file);
```

这样可以得到一段类似这样的内容：

```text
data:image/png;base64,xxxxxx
```

第三，调用后端接口。

点击按钮后，前端会请求自己的 API：

```ts
fetch("/api/recognize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ image: imageBase64 }),
});
```

这里我第一次比较直观地理解了：前端不应该直接调用百度 API，因为那样会暴露 API Key。更合理的方式是让前端请求自己的后端，再由后端去调用百度。

## 后端做了什么

后端接口在：

```text
app/api/recognize/route.ts
```

它主要做四步：

1. 从请求里拿到前端传来的图片 Base64。
2. 用 `.env.local` 里的百度 `API Key` 和 `Secret Key` 换取 `access_token`。
3. 拿 `access_token` 调用百度图片识别接口。
4. 把百度返回的数据整理一下，再返回给前端。

环境变量放在 `.env.local`：

```env
BAIDU_API_KEY=你的 API Key
BAIDU_SECRET_KEY=你的 Secret Key
```

这样密钥就不会写死在代码里。

## 最大的问题：一开始选错了接口

一开始我用的是百度的这个接口：

```text
object_detect
```

后来发现它更像是“检测图片里有没有物体”，并不适合生成图片描述。也就是说，它能告诉你“检测到了物体”，但不太适合回答“这张图大概是什么内容”。

所以后来把接口换成了：

```text
advanced_general
```

也就是“通用物体和场景识别”。

换接口后，还是用原来的：

```env
BAIDU_API_KEY
BAIDU_SECRET_KEY
```

不用重新换一套 Key。因为百度的流程是先用这两个 Key 换 `access_token`，然后用这个 token 去调用不同接口。

不过有一个前提：百度控制台里的应用要开通对应接口权限。如果没有开通，Key 本身没问题，但调用新接口时也可能失败。

## 换接口之后的效果

换成 `advanced_general` 后，百度会返回类似这样的标签：

```json
[
  {
    "keyword": "书本",
    "score": 0.86,
    "root": "商品-电脑办公"
  }
]
```

前端直接展示这种原始数据不太友好，所以后端做了一层整理，把它变成：

```json
{
  "name": "书本",
  "confidence": "86.00%",
  "category": "商品-电脑办公"
}
```

然后再简单拼成一句描述：

```text
图片中可能包含：书本、纸类，以及文字图片。
```

这里也让我明白了一点：百度这个接口本质上还是“识别标签”，不是像 ChatGPT 那样真正理解图片并写一段自然语言描述。

如果以后想要更自然的描述，比如“一个人坐在桌边看书，旁边有一杯咖啡”，可能就需要换成真正的多模态大模型。

## 测试时遇到的小问题

### 图片格式错误

测试时遇到过：

```json
{
  "error": "image format error",
  "errorCode": 216201
}
```

后来发现通常是测试图片格式不对，或者传给百度的 Base64 不符合要求。

前端传过来的是：

```text
data:image/png;base64,xxxxxx
```

但百度接口一般只需要逗号后面的纯 Base64，所以后端要处理一下：

```ts
const base64Data = image.includes(",") ? image.split(",")[1] : image;
```

### 图片尺寸错误

还遇到过：

```json
{
  "error": "image size error",
  "errorCode": 216202
}
```

这通常是测试图太小，或者图片尺寸不符合接口要求。后来改用正常一点的图片测试就好了。

### npm 命令在 PowerShell 里跑不起来

在 Windows PowerShell 里直接运行：

```powershell
npm run lint
```

可能会因为执行策略报错。

解决办法是改用：

```powershell
npm.cmd run lint
npm.cmd run build
```

这对 Windows 用户来说很实用。

### 构建时字体下载失败

项目最开始用了 `next/font/google`，构建时需要去 Google 下载字体。如果网络不通，`next build` 就会失败。

后来我把它去掉，直接使用系统字体。这样项目构建就不依赖外部网络了。

## 我的收获

这个项目虽然小，但对初学者来说挺有练习价值。

我主要学到了：

- Next.js 里可以同时写页面和 API。
- 前端不要直接暴露第三方平台的 API Key。
- 上传图片时可以用 Base64 传给后端。
- 第三方 API 的接口选择很重要，不同接口能力差别很大。
- 百度的 `object_detect` 更偏物体检测，`advanced_general` 更适合通用识别。
- API 返回的数据通常不能直接展示，需要后端整理。
- 真正开发时会遇到很多“不是代码逻辑本身”的问题，比如图片格式、环境变量、PowerShell、构建网络等。

## 后续可以怎么优化

接下来如果继续完善这个项目，我会考虑做几件事：

1. 在前端限制上传图片的格式和大小。
2. 把百度错误码转换成更容易理解的中文提示。
3. 缓存百度 `access_token`，不要每次识别都重新获取。
4. 如果想要更自然的图片描述，可以接入多模态大模型。
5. 优化页面展示，让结果看起来更像一个真正的小工具。

## 总结

这次实践让我感觉，做一个 Node.js 小项目最重要的不是一上来写很多复杂代码，而是把完整流程跑通：

```text
上传图片 -> 前端处理 -> 后端接口 -> 调第三方 API -> 返回结果 -> 页面展示
```

这个流程跑通之后，再慢慢优化体验、错误处理和代码结构，就会踏实很多。

