# Image Recognition Assistant - Agent Instructions

## 🎯 Project Overview

**Purpose**: A Chinese-language web application that allows users to upload images and receive AI-powered descriptions of image contents.

**Current Status**: 
- ✅ Frontend UI complete: image upload, preview, results layout
- ⏳ Backend API integration pending: AI recognition service not yet implemented
- Tech Stack: Next.js 16.2.6, React 19.2.4, TypeScript, Tailwind CSS v4, ESLint 9

**Key Files**:
- [app/page.tsx](app/page.tsx) - Main page with upload and preview UI
- [app/layout.tsx](app/layout.tsx) - Root layout with metadata
- [package.json](package.json) - Dependencies and scripts

---

## ⚡ Critical Next.js 16 Breaking Changes

**⚠️ This version has breaking changes**. Your training data may be outdated. Before writing code:
1. Check `node_modules/next/dist/docs/` for current APIs
2. Verify React 19.2.4 compatibility (older React patterns may not work)
3. Watch for deprecation notices in compiler output

Key differences from Next.js 13-15:
- App Router is the default (no pages/ directory)
- ESLint flat config required (no .eslintrc.js)
- TypeScript strict mode recommended
- React Server Components (RSC) as default

**Reference**: Official docs in node_modules or [Next.js documentation](https://nextjs.org/docs).

---

## 🚀 Development Setup

```bash
# Install dependencies
npm install

# Run dev server (auto-reload on file changes)
npm run dev
# Open http://localhost:3000

# Build for production
npm build

# Run production build locally
npm start

# Lint code
npm run lint
```

---

## 📁 Project Structure

```
app/
├── page.tsx              # Main page (client component, "use client")
├── layout.tsx            # Root layout (server component)
├── globals.css           # Global styles + Tailwind imports
└── favicon.ico
```

**App Router Convention**: Each route is a directory with page.tsx. No nested routes yet—keep flat for now.

---

## 💻 Code Conventions

### Component Patterns
- **Client Components**: Use `"use client"` directive for interactive features (see page.tsx)
- **Server Components**: Default; fetch data here, pass as props
- **Styling**: Tailwind utility classes (no CSS modules yet)

### TypeScript
- Strict mode enabled; use proper type annotations
- React type imports: `import { FC, useState } from "react"`
- Type Event handlers: `React.ChangeEvent<HTMLInputElement>`

### Tailwind CSS v4
- No @apply needed (updated syntax)
- Dark mode: Use `bg-zinc-950`, `text-white` (already applied)
- Responsive: `sm:`, `md:`, `lg:` prefixes supported
- Reference: [Tailwind v4 docs](https://tailwindcss.com/docs)

### ESLint
- Config: `eslint.config.mjs` (flat config format)
- Extends: Next.js core web vitals + TypeScript rules
- Run: `npm run lint` (checks `.ts`, `.tsx`, `.js`, `.jsx`)
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

---

## 🔄 Common Tasks

### Add a New Page
1. Create directory: `app/about/`
2. Add: `app/about/page.tsx` (auto-routed to `/about`)
3. Import components as needed (use `"use client"` if interactive)

### Add API Route
1. Create: `app/api/recognize/route.ts`
2. Export: `POST`, `GET`, etc. functions
3. Example: AI image recognition would go here (currently TODO)

### Update Styles
- Edit `app/globals.css` for global styles
- Use Tailwind classes in JSX (`className="..."`), no CSS-in-JS

### State Management
- Use React `useState` for simple client-side state (already used for imageUrl)
- For complex state across pages, consider Context API or external library

---

## 🛠️ Known Issues / TODOs

- **Image Recognition Backend**: Not yet implemented. Need to:
  - Choose AI service (OpenAI Vision, Claude, Gemini, etc.)
  - Create API route: `app/api/recognize/route.ts`
  - Connect to frontend upload handler
  - Display results in the results section

- **Layout Metadata**: Update `app/layout.tsx` title/description (currently default from create-next-app)

- **Error Handling**: Add try-catch for file uploads and API calls

---

## 📝 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Updates](https://react.dev/blog/2024/12/19/react-19)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎓 Agent Tips

When making changes:
1. **Always run `npm run lint`** after editing to catch TypeScript/ESLint issues
2. **Test in dev mode**: `npm run dev` auto-reloads; check terminal for errors
3. **Use `"use client"` carefully**: Only on interactive components; prefer server components for data fetching
4. **Preserve existing styles**: Tailwind classes are intentional (dark theme, spacing, etc.)
5. **Check node_modules docs** if API behavior seems unexpected (Next.js 16 may differ from your training data)
