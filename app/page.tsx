"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

interface RecognitionResult {
  name: string;
  confidence: string;
  category?: string;
}

type ShareAction = "download" | "copy";

const SHARE_URL = "https://image-recognition-xi.vercel.app";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("分享图生成失败，请重新上传图片"));
    image.src = src;
  });
}

async function createQrCodeImage() {
  const qrCodeDataUrl = await QRCode.toDataURL(SHARE_URL, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });

  return loadImage(qrCodeDataUrl);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const lines: string[] = [];
  let currentLine = "";

  for (const character of text) {
    const nextLine = currentLine + character;

    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("分享图导出失败，请重试"));
      }
    }, "image/png");
  });
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<ShareAction | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);
  const shareObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();

      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
      }

      if (shareObjectUrlRef.current) {
        URL.revokeObjectURL(shareObjectUrlRef.current);
      }
    };
  }, []);

  function cancelRecognition() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    cancelRecognition();
    setError(null);
    setDescription("");
    setResults([]);

    const url = URL.createObjectURL(file);
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
    }

    if (shareObjectUrlRef.current) {
      URL.revokeObjectURL(shareObjectUrlRef.current);
      shareObjectUrlRef.current = null;
    }

    imageObjectUrlRef.current = url;
    setImageUrl(url);
    setShareImageUrl(null);
    setShareStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleRecognize() {
    if (!imageBase64) {
      setError("请先上传图片");
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setDescription("");
    setResults([]);

    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64 }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "识别失败，请重试");
      }

      setDescription(data.description || "");
      setResults(data.results || []);
      setShareStatus(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("已取消识别");
        return;
      }

      setError(err instanceof Error ? err.message : "发生错误，请重试");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  }

  async function createShareImageBlob() {
    if (!imageBase64 || !description) {
      throw new Error("请先完成图片识别，再生成分享图");
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("当前浏览器不支持生成分享图");
    }

    const [sourceImage, qrCodeImage] = await Promise.all([
      loadImage(imageBase64),
      createQrCodeImage(),
    ]);
    const width = 1200;
    const height = 1800;
    const padding = 80;
    const cardX = 56;
    const cardWidth = width - cardX * 2;
    const imageBoxWidth = cardWidth - 48;
    const imageBoxHeight = 700;

    canvas.width = width;
    canvas.height = height;

    context.fillStyle = "#f3f4f6";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#111827";
    context.font = "700 54px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText("AI图片识别结果", padding, 116);

    context.fillStyle = "#6b7280";
    context.font = "400 26px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText("由 AI 图片识别工具生成", padding, 160);

    context.save();
    context.shadowColor = "rgba(15, 23, 42, 0.12)";
    context.shadowBlur = 28;
    context.shadowOffsetY = 12;
    context.fillStyle = "#ffffff";
    drawRoundedRect(context, cardX, 210, cardWidth, 1500, 36);
    context.fill();
    context.restore();

    const imageScale = Math.min(
      imageBoxWidth / sourceImage.naturalWidth,
      imageBoxHeight / sourceImage.naturalHeight
    );
    const imageWidth = sourceImage.naturalWidth * imageScale;
    const imageHeight = sourceImage.naturalHeight * imageScale;
    const imageX = cardX + 24 + (imageBoxWidth - imageWidth) / 2;
    const imageY = 234 + (imageBoxHeight - imageHeight) / 2;

    context.save();
    drawRoundedRect(context, cardX + 24, 234, imageBoxWidth, imageBoxHeight, 28);
    context.clip();
    context.fillStyle = "#f9fafb";
    context.fillRect(cardX + 24, 234, imageBoxWidth, imageBoxHeight);
    context.drawImage(sourceImage, imageX, imageY, imageWidth, imageHeight);
    context.restore();

    context.fillStyle = "#111827";
    context.font = "700 36px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText("图片描述", padding, 1010);

    context.fillStyle = "#374151";
    context.font = "400 30px Arial, 'Microsoft YaHei', sans-serif";
    const descriptionLines = wrapText(context, description, width - padding * 2);
    const visibleDescriptionLines = descriptionLines.slice(0, 5);

    visibleDescriptionLines.forEach((line, index) => {
      context.fillText(line, padding, 1064 + index * 44);
    });

    let resultY = 1110 + visibleDescriptionLines.length * 44;

    if (results.length > 0) {
      context.fillStyle = "#111827";
      context.font = "700 34px Arial, 'Microsoft YaHei', sans-serif";
      context.fillText("识别要点", padding, resultY);
      resultY += 44;

      context.font = "400 27px Arial, 'Microsoft YaHei', sans-serif";
      results.slice(0, 3).forEach((result) => {
        const label = `${result.name}${result.category ? ` · ${result.category}` : ""}`;
        const confidence = result.confidence;

        context.fillStyle = "#eff6ff";
        drawRoundedRect(context, padding, resultY - 30, width - padding * 2, 56, 18);
        context.fill();

        context.fillStyle = "#1f2937";
        context.fillText(label, padding + 24, resultY + 7);

        context.fillStyle = "#2563eb";
        context.font = "700 25px Arial, 'Microsoft YaHei', sans-serif";
        context.fillText(confidence, width - padding - 120, resultY + 7);

        context.font = "400 27px Arial, 'Microsoft YaHei', sans-serif";
        resultY += 70;
      });
    }

    const footerY = 1568;
    const qrSize = 160;
    const qrX = width - padding - qrSize;
    const qrY = footerY - 26;

    context.fillStyle = "#111827";
    context.font = "700 30px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText("扫码体验图片识别工具", padding + 28, footerY + 20);

    context.fillStyle = "#6b7280";
    context.font = "400 25px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText(SHARE_URL.replace("https://", ""), padding + 28, footerY + 68);

    context.fillStyle = "#9ca3af";
    context.font = "400 22px Arial, 'Microsoft YaHei', sans-serif";
    context.fillText("image-recognition", padding + 28, footerY + 122);

    context.fillStyle = "#ffffff";
    drawRoundedRect(context, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 24);
    context.fill();
    context.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);

    return canvasToBlob(canvas);
  }

  async function handleShare(action: ShareAction) {
    setSharing(action);
    setShareStatus(null);
    setError(null);

    try {
      const blob = await createShareImageBlob();
      const url = URL.createObjectURL(blob);

      if (shareObjectUrlRef.current) {
        URL.revokeObjectURL(shareObjectUrlRef.current);
      }

      shareObjectUrlRef.current = url;
      setShareImageUrl(url);

      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `ai-image-recognition-${Date.now()}.png`;
        link.click();
        setShareStatus("分享图已生成并开始下载。");
      } else {
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
          throw new Error("当前浏览器不支持复制图片，请改用下载分享图");
        }

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setShareStatus("分享图已复制到剪贴板。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "分享图生成失败，请重试");
    } finally {
      setSharing(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 pt-48 pb-12 text-gray-500">
      <div className="fixed right-6 top-6 z-10">
        <a
          href="https://github.com/Nightingale76"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:border-gray-300 hover:bg-white hover:text-gray-950"
          aria-label="打开开发者 GitHub 主页"
        >
          <span className="text-gray-400">开发者主页</span>
        </a>
      </div>

      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-6xl font-bold">AI图片识别工具</h1>

        <p className="mx-auto text-center max-w-2xl mt-10 text-lg leading-8 text-zinc-400">
          上传图片，让 AI 快速分析画面内容，并生成清晰的文字描述。
        </p>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block w-full cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-600 transition hover:border-blue-400 hover:bg-blue-50"
          />

          {imageUrl && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-gray-500">图片预览：</p>
              <Image
                src={imageUrl}
                alt="上传的图片"
                width={900}
                height={520}
                unoptimized
                className="max-h-[420px] w-auto rounded-2xl border border-gray-200 bg-gray-50 object-contain"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleRecognize}
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? "识别中..." : "开始识别"}
                </button>

                {loading && (
                  <button
                    onClick={cancelRecognition}
                    className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-40"
                  >
                    取消识别
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">错误：{error}</p>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800">识别结果</h2>

          {description ? (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-lg text-gray-700">
              {description}
            </p>
          ) : (
            <p className="mt-4 text-gray-500">
              {loading
                ? "正在识别图片内容..."
                : "上传并识别图片后，识别结果会显示在这里。"}
            </p>
          )}

          {results.length > 0 && (
            <div className="mt-4 space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div>
                    <span className="text-lg text-gray-800">{result.name}</span>
                    {result.category && (
                      <p className="mt-1 text-sm text-gray-500">
                        分类：{result.category}
                      </p>
                    )}
                  </div>
                  <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {result.confidence}
                  </span>
                </div>
              ))}
            </div>
          )}

          {description && imageBase64 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-xl font-semibold text-gray-800">
                分享识别结果
              </h3>
              <p className="mt-2 text-gray-500">
                生成一张包含原图、识别描述和识别要点的 PNG 分享图。
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleShare("download")}
                  disabled={sharing !== null}
                  className="w-full rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {sharing === "download" ? "正在生成..." : "下载分享图"}
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  disabled={sharing !== null}
                  className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {sharing === "copy" ? "正在复制..." : "复制分享图"}
                </button>
              </div>

              {shareStatus && (
                <p className="mt-3 text-sm text-green-700">{shareStatus}</p>
              )}

              {shareImageUrl && (
                <div className="mt-4">
                  <p className="mb-3 text-sm text-gray-500">分享图预览：</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shareImageUrl}
                    alt="生成的分享图"
                    className="max-h-[520px] w-auto rounded-2xl border border-gray-200 bg-gray-50 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
