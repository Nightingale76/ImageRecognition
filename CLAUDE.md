# Image Recognition Assistant - Quick Reference

## ⚡ Quick Start

```bash
npm run dev              # Start dev server (port 3000)
npm run lint             # Check code
npm run build && npm start  # Production build
```

## 📋 Essential Info

- **Framework**: Next.js 16.2.6 + React 19.2.4 + TypeScript + Tailwind CSS v4
- **Main Page**: [app/page.tsx](app/page.tsx) - Chinese UI for image upload & recognition
- **Layout**: [app/layout.tsx](app/layout.tsx) - Root layout
- **Status**: Frontend ✅ | Backend API ⏳
- **⚠️ IMPORTANT**: Next.js 16 has breaking changes—check `node_modules/next/dist/docs/` before coding

## 🚀 What To Do Next

1. **Implement AI Recognition API**
   - Create `app/api/recognize/route.ts`
   - Connect to image recognition service (OpenAI Vision, Claude, Gemini, etc.)
   - Update frontend to call API and display results

2. **Update Metadata** in [app/layout.tsx](app/layout.tsx)
   - Change title from "Create Next App" to "图片识别助手"

3. **Add Error Handling** for image uploads

## 📖 Full Context

See [AGENTS.md](AGENTS.md) for detailed conventions, structure, and development guidelines.
