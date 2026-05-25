import fs from "fs";
import path from "path";

// 读取一张测试图片（使用项目中的 favicon）
const testImagePath = path.join(process.cwd(), "public", "favicon.ico");

if (!fs.existsSync(testImagePath)) {
  console.error("Test image not found at:", testImagePath);
  process.exit(1);
}

const imageBuffer = fs.readFileSync(testImagePath);
const base64 = imageBuffer.toString("base64");
const dataUrl = `data:image/x-icon;base64,${base64}`;

// 调用本地 API
async function testAPI() {
  try {
    console.log("Testing API with image size:", imageBuffer.length, "bytes");
    console.log("Base64 size:", base64.length, "characters");

    const response = await fetch("http://localhost:3000/api/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: dataUrl }),
    });

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test error:", error);
  }
}

testAPI();
