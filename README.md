# AI 图片识别工具

一个基于 Next.js 的中文图片识别 Web 应用。用户可以上传图片，调用 AI 视觉模型识别画面内容，生成中文描述和识别要点，并进一步生成可下载或可复制的分享图。

线上访问地址：

https://image-recognition-xi.vercel.app/

## 功能特性

- 图片上传与本地预览
- AI 图片内容识别
- 中文自然语言图片描述
- 识别要点列表展示，包括主体、分类和置信度
- 支持取消正在进行的识别请求
- 支持生成分享图
- 分享图包含原图、识别描述、前三个识别要点、访问域名和二维码
- 支持下载分享图到本地
- 支持复制分享图到剪贴板，浏览器不支持时可使用下载作为替代
- 页面右上角提供开发者 GitHub 主页入口

## 使用方式

### 在线使用

1. 打开线上地址：

   https://image-recognition-xi.vercel.app/

2. 点击上传区域，选择一张图片。

3. 图片预览出现后，点击“开始识别”。

4. 等待 AI 返回识别结果。

5. 查看图片描述和识别要点。

6. 识别完成后，可以点击“下载分享图”或“复制分享图”。

### 本地运行

克隆项目后安装依赖：

```bash
npm install
```

新建 `.env.local` 文件，并配置环境变量：

```env
DASHSCOPE_API_KEY=你的 DashScope API Key
QWEN_MODEL=qwen3.6-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

启动开发服务器：

```bash
npm run dev
```

打开本地地址：

```text
http://localhost:3000
```

## 主要技术栈

- Next.js 16.2.6
- React 19.2.4
- TypeScript
- Tailwind CSS v4
- ESLint 9
- Qwen / DashScope 视觉模型接口
- qrcode，用于生成分享图二维码
- Vercel，用于线上部署

## 功能实现方式

### 前端页面

主页面位于：

```text
app/page.tsx
```

页面使用 Client Component 实现交互逻辑，主要包括：

- 使用 `input[type="file"]` 选择图片
- 使用 `URL.createObjectURL` 生成本地预览地址
- 使用 `FileReader` 将图片转换为 Base64 Data URL
- 使用 `fetch` 调用后端识别接口
- 使用 `AbortController` 支持取消识别请求
- 使用 Canvas 绘制分享图
- 使用 Clipboard API 复制 PNG 图片到剪贴板

### 后端识别接口

识别接口位于：

```text
app/api/recognize/route.ts
```

接口接收前端传入的图片 Base64 数据，然后调用 DashScope 兼容 OpenAI Chat Completions 格式的视觉模型接口。

接口会要求模型返回 JSON：

```json
{
  "description": "用中文自然描述图片内容",
  "results": [
    {
      "name": "识别到的主体或元素",
      "confidence": "高/中/低",
      "category": "可选分类"
    }
  ]
}
```

如果模型返回 Markdown 代码块，接口会先去除代码块标记，再尝试解析 JSON。若解析失败，则把模型文本作为普通描述返回。

### 分享图生成

分享图在浏览器端生成，不依赖后端图片服务。

实现流程：

1. 读取用户上传的图片 Base64。
2. 使用 `qrcode` 生成指向线上域名的二维码。
3. 创建 Canvas。
4. 绘制背景、标题、原图、图片描述和前三个识别要点。
5. 在底部绘制访问域名和二维码。
6. 将 Canvas 导出为 PNG Blob。
7. 根据用户操作触发下载或复制到剪贴板。

当前分享链接：

```text
https://image-recognition-xi.vercel.app
```

## 项目结构

```text
app/
├── api/
│   └── recognize/
│       └── route.ts       # 图片识别 API
├── globals.css            # 全局样式与 Tailwind 引入
├── layout.tsx             # 根布局与页面元信息
└── page.tsx               # 主页面、上传识别和分享图功能

public/                    # 静态资源目录
next.config.ts             # Next.js 配置
package.json               # 依赖和脚本
README.md                  # 项目说明
```

## 可用脚本

启动开发环境：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

启动生产服务：

```bash
npm start
```

运行代码检查：

```bash
npm run lint
```

## 环境变量

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `DASHSCOPE_API_KEY` | 是 | DashScope API Key，用于调用 Qwen 视觉模型 |
| `QWEN_MODEL` | 否 | 模型名称，默认 `qwen3.6-plus` |
| `QWEN_BASE_URL` | 否 | DashScope 兼容模式接口地址 |

部署到 Vercel 时，需要在 Vercel 项目的 Environment Variables 中配置这些变量。不要将 `.env.local` 提交到公开仓库。

## 部署

本项目已部署在 Vercel：

https://image-recognition-xi.vercel.app/

如果重新部署，可以按以下流程：

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入仓库。
3. Application Preset 选择 `Next.js`。
4. Root Directory 保持 `./`。
5. 添加环境变量。
6. 点击 Deploy。

Vercel 会自动执行 Next.js 构建，并部署页面与 API Route。

## 注意事项

- 图片识别依赖 DashScope API Key，未配置时接口会返回错误。
- 复制分享图依赖浏览器 Clipboard API，部分浏览器或非 HTTPS 环境可能不支持复制图片。
- 分享图中的二维码指向当前线上域名，如果域名变更，需要同步更新代码中的分享地址。
- 上传图片会在浏览器端转换为 Base64 后发送给后端，建议避免上传过大的图片。

## 开发者

GitHub：

https://github.com/Nightingale76

## License

本项目当前未声明开源许可证。如需公开复用或二次分发，请先补充许可证说明。
