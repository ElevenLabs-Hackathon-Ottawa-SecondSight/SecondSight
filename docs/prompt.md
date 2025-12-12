# Master Prompt (final)

1) If `docs/hackathon.md` exists, **read it fully first** and use its flows/UX tone as context.

2) Build a Next.js 16 App Router app (TypeScript + Tailwind) named “Second Sight” with Clerk + ElevenLabs fully wired and vision/search/memory APIs. No real secrets in code; use placeholders.

3) Auth (Clerk, App Router):
- Install `@clerk/nextjs@latest`.
- `proxy.ts` (root; `src/proxy.ts` if `src/` exists):
  ```ts
  import { clerkMiddleware } from "@clerk/nextjs/server";
  export default clerkMiddleware();
  export const config = {
    matcher: [
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
      "/(api|trpc)(.*)",
    ],
  };
  ```
- `middleware.ts` re-exports default/config from `./proxy`.
- `app/layout.tsx` wraps in `<ClerkProvider>`; header shows sign-in/up when signed out and user button when signed in.

4) UI (`app/page.tsx`):
- Fullscreen camera video background; glassmorphism HUD (neon green, dark).
- Status chip (Idle/Listening/Thinking/Looking/Searching/Saving/Recalling/Error).
- Recent activity log.
- Pulsing mic/agent toggle.
- Four action chips: getVisualContext → `/api/vision`; webSearch → `/api/search`; saveMemory → `/api/memory/save`; readMemory → `/api/memory/read`.
- Camera via `<video>` + hidden `<canvas>`; request `getUserMedia` on mount.
- Show Agent ID if set; otherwise prompt to set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
- Styling in `app/globals.css`: gradients, glass panels, neon borders, pulse animation, status chips, HUD grid.
- Keep manual buttons active even when agent is connected.

5) ElevenLabs (required):
- Use `@11labs/react` and `useConversation` bound to `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
- Register client tools (names + schemas):
  - `getVisualContext`: description “Analyze the camera view”; params `{}`.
  - `webSearch`: description “Search the web”; params `{ "type":"object","properties":{"query":{"type":"string"}},"required":["query"] }`.
  - `saveMemory`: description “Save a fact to long-term memory”; params `{ "type":"object","properties":{"fact":{"type":"string"}},"required":["fact"] }`.
  - `readMemory`: description “Retrieve saved memories”; params `{}`.
- Tools call the same handlers as the buttons:
  - getVisualContext: status “Looking…”, capture frame, POST `/api/vision`, return text.
  - webSearch: status “Searching…”, POST `/api/search`, return summary.
  - saveMemory: status “Saving…”, POST `/api/memory/save`, return message.
  - readMemory: status “Recalling…”, POST `/api/memory/read`, return memories joined or “No memories yet”.
- Reflect agent connection/listening state; keep manual buttons as fallback.

6) API routes:
- `/app/api/vision/route.ts`:
  - POST `{ image: string }` (base64 or data URL).
  - **Gotchas:** strip newlines; detect mime from data URL; default `media_type` to image/jpeg; tiny 1x1 can be rejected—prefer real frames.
  - Use `@anthropic-ai/sdk` model `claude-haiku-4-5` (vision). If unavailable, allow configurable fallback (e.g., `claude-sonnet-4-5`) via a constant/flag.
  - System prompt: “Describe this image for a blind person. Identify text and objects.”
  - Handle missing `ANTHROPIC_API_KEY` (500), validation errors (400), and surface Anthropic errors (model not found/vision not enabled) as clear 502/500 JSON. Return `{ text }`.
- `/app/api/search/route.ts`: POST `{ query }`, Tavily (`TAVILY_API_KEY`, `max_results: 3`, `include_answer: true`), return `{ summary }`, handle missing key/errors.
- `/app/api/memory/save/route.ts`: POST `{ fact }`, `auth()` enforced; append to `publicMetadata.memories` via `clerkClient`; return `{ message: "Memory saved." }`; 401 if not signed in.
- `/app/api/memory/read/route.ts`: POST (no body); `auth()` enforced; return `{ memories }`.

7) Client logic in `app/page.tsx`:
- `captureFrame()` (video→canvas→dataURL).
- `callApi` helper with JSON fetch + error handling.
- `tools` object shared by manual chips and ElevenLabs tool hooks; set/reset status and log results.

8) Styling/config:
- Tailwind scans `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`.
- TS config: `moduleResolution: "Bundler"`, `jsx: "preserve"`, `strict: true`, `noEmit: true`, include `next-env.d.ts`, plugin `{ name: "next" }`.

9) Environment/gitignore:
- `.env.example` placeholders:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
  CLERK_SECRET_KEY=YOUR_SECRET_KEY
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID=YOUR_AGENT_ID
  ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY
  TAVILY_API_KEY=YOUR_TAVILY_KEY
  ```
- `.gitignore`: `.env*`, `.next`, `node_modules`, logs.

10) Dependencies (package.json):
- deps: `next@latest`, `react`, `react-dom`, `@clerk/nextjs`, `@anthropic-ai/sdk`, `@11labs/react`, `classnames`, `lucide-react`, `framer-motion`, `tailwindcss`, `postcss`, `autoprefixer`, `zod`.
- devDeps: `typescript`, `eslint`, `eslint-config-next`, `@types/node`, `@types/react`, `@types/react-dom`.
- scripts: `dev`, `build`, `start`, `lint`.

11) Operational notes:
- App Router only (no pages/_app).
- Clerk middleware must be active via `proxy.ts` + `middleware.ts`.
- Use https (or ngrok/Vercel) for camera + Clerk session.
- Vision reliability: clean base64 (no newlines), real frames; surface Anthropic errors clearly.
- Keep manual HUD buttons even with ElevenLabs agent connected.

Return the full file set in correct structure; no real secrets.
