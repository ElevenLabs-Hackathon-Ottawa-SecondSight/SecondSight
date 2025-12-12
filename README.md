# Second Sight

<div align="center">

![Second Sight](https://img.shields.io/badge/Second%20Sight-Reality%20OS-00C896?style=for-the-badge&logo=eye&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

**A Multimodal Reality OS that Sees, Knows, and Remembers**

[Live Demo](#live-demo) • [Features](#features) • [Getting Started](#getting-started) • [Architecture](#architecture)

</div>

---

## 🎯 What is Second Sight?

**Second Sight** is an AI-powered accessibility platform designed as a "Reality Operating System" for visually impaired users. It combines real-time computer vision, voice interaction, web search, and persistent memory into a seamless, hands-free experience.

Using your device's camera as "eyes" and natural voice commands, Second Sight can:

- **See** — Analyze and describe what's in front of the camera in real-time
- **Know** — Search the web for information using natural language queries  
- **Remember** — Store and recall personal facts and context across sessions

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice-First Interface** | Conversational AI powered by ElevenLabs for natural, hands-free interaction |
| 👁️ **Visual Analysis** | Real-time camera feed analysis using Anthropic Claude vision |
| 🔍 **Web Search** | Instant knowledge retrieval via Tavily search API |
| 🧠 **Persistent Memory** | Save and recall facts stored securely with your user profile |
| 🔐 **Secure Authentication** | User accounts powered by Clerk with OAuth support |
| 📱 **Mobile-First Design** | Responsive glassmorphism UI optimized for mobile devices |

## 🖥️ Live Demo

> **Coming Soon** — Deploy your own instance using the instructions below.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm**
- API keys for the required services (see [Environment Variables](#environment-variables))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/SecondSight.git
   cd SecondSight
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and fill in your API keys:

   ```bash
   cp env.example .env.local
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication | [clerk.com](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth | [clerk.com](https://dashboard.clerk.com) |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ElevenLabs conversational agent ID | [elevenlabs.io](https://elevenlabs.io) → Conversational AI |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude vision | [console.anthropic.com](https://console.anthropic.com) |
| `TAVILY_API_KEY` | Tavily API key for web search | [tavily.com](https://tavily.com) |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code quality checks |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SECOND SIGHT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Clerk     │    │  ElevenLabs  │    │   Browser    │      │
│  │    Auth      │    │    Agent     │    │   Camera     │      │
│  │  (Gatekeeper)│    │   (Brain)    │    │   (Eyes)     │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   Next.js App   │                          │
│                    │   (Frontend)    │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐         │
│  │ /api/vision │    │ /api/search │    │ /api/memory │         │
│  │  (Claude)   │    │  (Tavily)   │    │  (Clerk)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + Framer Motion
- **Auth:** Clerk
- **Voice AI:** ElevenLabs Conversational AI
- **Vision AI:** Anthropic Claude
- **Search:** Tavily API
- **Icons:** Lucide React

## 📁 Project Structure

```
SecondSight/
├── app/
│   ├── api/
│   │   ├── memory/
│   │   │   ├── read/route.ts    # Retrieve saved memories
│   │   │   └── save/route.ts    # Store new memories
│   │   ├── search/route.ts      # Tavily web search
│   │   └── vision/route.ts      # Claude vision analysis
│   ├── globals.css              # Global styles & theme
│   ├── layout.tsx               # Root layout with Clerk
│   └── page.tsx                 # Main application UI
├── components/
│   └── ToolCard.tsx             # Reusable tool card component
├── docs/                        # Documentation
├── env.example                  # Environment template
└── package.json
```

## 🔒 Security

- All API routes are protected and require authenticated sessions
- User memories are stored securely in Clerk's user metadata
- Camera access requires explicit user permission
- No video/audio data is stored on servers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io) — Conversational AI platform
- [Anthropic](https://anthropic.com) — Claude vision model
- [Clerk](https://clerk.com) — Authentication infrastructure
- [Tavily](https://tavily.com) — AI-powered search API
- [Vercel](https://vercel.com) — Next.js deployment platform

---

<div align="center">

**Built with ❤️ for accessibility**

</div>
