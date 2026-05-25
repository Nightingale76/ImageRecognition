import { NextRequest, NextResponse } from "next/server";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen3.6-plus";
const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL ||
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

interface RecognitionResult {
  name: string;
  confidence: string;
  category?: string;
}

interface QwenRecognitionContent {
  description?: string;
  results?: RecognitionResult[];
}

interface QwenChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
  };
}

function getImageUrl(image: string) {
  if (image.startsWith("data:image/")) {
    return image;
  }

  return `data:image/jpeg;base64,${image}`;
}

function stripMarkdownFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseRecognitionContent(content: string): QwenRecognitionContent {
  try {
    return JSON.parse(stripMarkdownFence(content)) as QwenRecognitionContent;
  } catch {
    return {
      description: content.trim(),
      results: [],
    };
  }
}

async function recognizeImage(image: string): Promise<QwenRecognitionContent> {
  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: getImageUrl(image),
              },
            },
            {
              type: "text",
              text:
                "请识别这张图片，并只返回 JSON，不要返回 Markdown。格式为：" +
                '{"description":"用中文自然描述图片内容","results":[{"name":"识别到的主体或元素","confidence":"高/中/低","category":"可选分类"}]}',
            },
          ],
        },
      ],
    }),
  });

  const data = (await response.json()) as QwenChatResponse;

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || `Qwen 识别接口请求失败：${response.status}`
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Qwen 未返回有效识别结果");
  }

  return parseRecognitionContent(content);
}

export async function POST(request: NextRequest) {
  try {
    const { image } = (await request.json()) as { image?: string };

    if (!image) {
      return NextResponse.json({ error: "请先上传图片" }, { status: 400 });
    }

    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: "DashScope API Key 未配置，请检查 .env.local" },
        { status: 500 }
      );
    }

    const qwenResult = await recognizeImage(image);

    return NextResponse.json({
      success: true,
      description: qwenResult.description || "暂未识别出明确的图片内容。",
      results: qwenResult.results || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "图片识别失败";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
