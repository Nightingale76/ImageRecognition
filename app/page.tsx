"use client";

import Image from "next/image";
import { useState } from "react";

interface RecognitionResult {
  name: string;
  confidence: string;
  category?: string;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setDescription("");
    setResults([]);

    const url = URL.createObjectURL(file);
    setImageUrl(url);

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

    setLoading(true);
    setError(null);
    setDescription("");

    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "识别失败，请重试");
      }

      setDescription(data.description || "");
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">图片识别助手</h1>

        <p className="mt-4 text-zinc-300">
          上传一张图片，系统会识别图片内容，并用文字描述可能看到了什么。
        </p>

        <div className="mt-8 rounded-3xl bg-white/10 p-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={loading}
            className="block w-full cursor-pointer rounded-xl border border-white/20 p-4 text-zinc-300 disabled:opacity-50"
          />

          {imageUrl && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-zinc-400">图片预览：</p>
              <Image
                src={imageUrl}
                alt="上传的图片"
                width={900}
                height={520}
                unoptimized
                className="max-h-[420px] w-auto rounded-2xl object-contain"
              />

              <button
                onClick={handleRecognize}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {loading ? "识别中..." : "开始识别"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-8 rounded-3xl border border-red-500 bg-red-500/20 p-6">
            <p className="text-red-200">错误：{error}</p>
          </div>
        )}

        <div className="mt-8 rounded-3xl bg-white/10 p-6">
          <h2 className="text-2xl font-semibold">识别结果</h2>

          {description ? (
            <p className="mt-4 rounded-xl bg-white/5 p-4 text-lg text-zinc-100">
              {description}
            </p>
          ) : (
            <p className="mt-4 text-zinc-300">
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-4"
                >
                  <div>
                    <span className="text-lg text-zinc-200">{result.name}</span>
                    {result.category && (
                      <p className="mt-1 text-sm text-zinc-400">
                        分类：{result.category}
                      </p>
                    )}
                  </div>
                  <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-semibold">
                    {result.confidence}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
