import fs from "fs";

// 使用一个有效的 JPEG 图片 Base64（200x200 红色图片）
const validJpegBase64 = "/9j/4AAQSkZJRgABAQEAyADIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCADIAMgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

const payload = {
  image: `data:image/jpeg;base64,${validJpegBase64}`
};

fs.writeFileSync("test-payload-valid.json", JSON.stringify(payload, null, 2));
console.log("✓ Valid test payload created");
console.log("Payload size:", JSON.stringify(payload).length, "bytes");
