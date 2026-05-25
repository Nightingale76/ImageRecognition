import { NextRequest, NextResponse } from "next/server";

const BAIDU_API_KEY = process.env.BAIDU_API_KEY || "";
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || "";

interface BaiduTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface BaiduAdvancedGeneralItem {
  keyword?: string;
  name?: string;
  root?: string;
  score?: number;
}

interface BaiduAdvancedGeneralResponse {
  result?: BaiduAdvancedGeneralItem[];
  result_num?: number;
  error_code?: number;
  error_msg?: string;
  log_id?: number;
}

interface RecognitionResult {
  name: string;
  confidence: string;
  category?: string;
}

async function getBaiduToken(): Promise<string> {
  const tokenUrl = new URL("https://aip.baidubce.com/oauth/2.0/token");
  tokenUrl.searchParams.set("grant_type", "client_credentials");
  tokenUrl.searchParams.set("client_id", BAIDU_API_KEY);
  tokenUrl.searchParams.set("client_secret", BAIDU_SECRET_KEY);

  const response = await fetch(tokenUrl, { method: "POST" });
  const data = (await response.json()) as BaiduTokenResponse;

  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || "获取百度访问令牌失败");
  }

  return data.access_token;
}

async function recognizeImage(
  imageBase64: string,
  token: string
): Promise<BaiduAdvancedGeneralResponse> {
  const recognizeUrl = new URL(
    "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general"
  );
  recognizeUrl.searchParams.set("access_token", token);

  const response = await fetch(recognizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      image: imageBase64,
    }),
  });

  const data = (await response.json()) as BaiduAdvancedGeneralResponse;

  if (!response.ok) {
    throw new Error(data.error_msg || `百度识别接口请求失败：${response.status}`);
  }

  return data;
}

function formatResults(items: BaiduAdvancedGeneralItem[] = []): RecognitionResult[] {
  return items
    .map((item) => ({
      name: item.keyword || item.name || "未知内容",
      confidence:
        typeof item.score === "number"
          ? `${(item.score * 100).toFixed(2)}%`
          : "未知",
      category: item.root,
    }))
    .filter((item) => item.name !== "未知内容");
}

function buildDescription(results: RecognitionResult[]): string {
  if (results.length === 0) {
    return "暂未识别出明确的图片内容。";
  }

  const names = results.slice(0, 5).map((item) => item.name);

  if (names.length === 1) {
    return `图片中可能包含：${names[0]}。`;
  }

  const lastName = names[names.length - 1];
  const leadingNames = names.slice(0, -1).join("、");

  return `图片中可能包含：${leadingNames}，以及${lastName}。`;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = (await request.json()) as { image?: string };

    if (!image) {
      return NextResponse.json({ error: "请先上传图片" }, { status: 400 });
    }

    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return NextResponse.json(
        { error: "百度 API 密钥未配置，请检查 .env.local" },
        { status: 500 }
      );
    }

    const token = await getBaiduToken();
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const baiduResult = await recognizeImage(base64Data, token);

    if (baiduResult.error_code) {
      return NextResponse.json(
        {
          error: baiduResult.error_msg || "图片识别失败",
          errorCode: baiduResult.error_code,
        },
        { status: 400 }
      );
    }

    const results = formatResults(baiduResult.result);

    return NextResponse.json({
      success: true,
      description: buildDescription(results),
      results,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "图片识别失败";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
