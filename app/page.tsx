"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
  type JSX,
} from "react";
import { motion } from "framer-motion";
import classNames from "classnames";
import { useConversation } from "@11labs/react";
import {
  Activity,
  BookOpen,
  Camera,
  Link2,
  Mic,
  Radio,
  Save,
  Search,
  Square,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";

const statusStyle: Record<string, { dot: string; chip: string }> = {
  Idle: { dot: "bg-emerald-400", chip: "status-idle" },
  Listening: { dot: "bg-cyan-400", chip: "status-listening" },
  Thinking: { dot: "bg-purple-400", chip: "status-thinking" },
  Looking: { dot: "bg-lime-400", chip: "status-looking" },
  Searching: { dot: "bg-sky-400", chip: "status-searching" },
  Saving: { dot: "bg-emerald-400", chip: "status-saving" },
  Recalling: { dot: "bg-indigo-400", chip: "status-recalling" },
  Error: { dot: "bg-rose-500", chip: "status-error" },
};

type StatusKey = keyof typeof statusStyle;

type ActivityItem = {
  ts: number;
  message: string;
};

type ClientTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args?: any) => Promise<string>;
};

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export default function Home() {
  const videoBgRef = useRef<HTMLVideoElement>(null);
  const videoHudRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<StatusKey>("Idle");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  const pushActivity = useCallback((message: string) => {
    setActivity((prev) => [{ ts: Date.now(), message }, ...prev].slice(0, 12));
  }, []);

  const callApi = useCallback(async <T,>(path: string, payload?: any): Promise<T> => {
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (body as any)?.error || (body as any)?.message || "Request failed";
      throw new Error(message);
    }
    return body as T;
  }, []);

  const captureFrame = useCallback(async () => {
    const video = videoHudRef.current || videoBgRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) throw new Error("Camera is not ready yet.");
    if (!video.videoWidth || !video.videoHeight) throw new Error("Waiting for camera to warm up.");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return dataUrl.replace(/\n|\r/g, "");
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    let stream: MediaStream | null = null;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoBgRef.current) {
          videoBgRef.current.srcObject = stream;
          await videoBgRef.current.play().catch(() => undefined);
        }
        if (videoHudRef.current) {
          videoHudRef.current.srcObject = stream;
          await videoHudRef.current.play().catch(() => undefined);
        }
      } catch (err: any) {
        setError(err?.message || "Camera permission denied");
        setStatus("Error");
      }
    };
    init();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isSignedIn]);

  const toolHandlers = useMemo(
    () => ({
      getVisualContext: async () => {
        setBusy("getVisualContext");
        setStatus("Looking");
        try {
          const image = await captureFrame();
          const { text } = await callApi<{ text: string }>("/api/vision", { image });
          pushActivity(`Vision → ${text}`);
          setStatus("Idle");
          return text;
        } catch (err: any) {
          const message = err?.message || "Vision failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Vision error → ${message}`);
          return message;
        } finally {
          setBusy(null);
        }
      },
      webSearch: async ({ query }: { query: string }) => {
        setBusy("webSearch");
        setStatus("Searching");
        try {
          const { summary } = await callApi<{ summary: string }>("/api/search", { query });
          pushActivity(`Search → ${summary}`);
          setStatus("Idle");
          return summary;
        } catch (err: any) {
          const message = err?.message || "Search failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Search error → ${message}`);
          return message;
        } finally {
          setBusy(null);
        }
      },
      saveMemory: async ({ fact }: { fact: string }) => {
        setBusy("saveMemory");
        setStatus("Saving");
        try {
          const { message } = await callApi<{ message: string }>("/api/memory/save", { fact });
          pushActivity(`Memory saved → ${fact}`);
          setStatus("Idle");
          return message;
        } catch (err: any) {
          const message = err?.message || "Save failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Save error → ${message}`);
          return message;
        } finally {
          setBusy(null);
        }
      },
      readMemory: async () => {
        setBusy("readMemory");
        setStatus("Recalling");
        try {
          const { memories } = await callApi<{ memories: string[] }>("/api/memory/read");
          const text = memories.length ? memories.join(" • ") : "No memories yet";
          pushActivity(`Memories → ${text}`);
          setStatus("Idle");
          return text;
        } catch (err: any) {
          const message = err?.message || "Recall failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Recall error → ${message}`);
          return message;
        } finally {
          setBusy(null);
        }
      },
    }),
    [callApi, captureFrame, pushActivity]
  );

  const clientTools: ClientTool[] = useMemo(
    () => [
      {
        name: "getVisualContext",
        description: "Analyze the camera view",
        parameters: {},
        execute: toolHandlers.getVisualContext,
      },
      {
        name: "webSearch",
        description: "Search the web",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
        execute: toolHandlers.webSearch,
      },
      {
        name: "saveMemory",
        description: "Save a fact to long-term memory",
        parameters: {
          type: "object",
          properties: { fact: { type: "string" } },
          required: ["fact"],
        },
        execute: toolHandlers.saveMemory,
      },
      {
        name: "readMemory",
        description: "Retrieve saved memories",
        parameters: {},
        execute: toolHandlers.readMemory,
      },
    ],
    [toolHandlers]
  );

  const conversation = useConversation({
    agentId: AGENT_ID || "",
    clientTools: clientTools as any,
  } as any);

  const { connect, disconnect, isConnected, isRecording, startRecording, stopRecording, status: agentStatus } =
    conversation as any;

  const handleAgentToggle = async () => {
    if (!AGENT_ID) {
      setError("Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to connect the agent.");
      return;
    }
    try {
      if (!isConnected) {
        setStatus("Listening");
        await connect?.();
        await startRecording?.();
        pushActivity("Agent connected");
      } else if (!isRecording) {
        setStatus("Listening");
        await startRecording?.();
        pushActivity("Agent listening");
      } else {
        setStatus("Idle");
        await stopRecording?.();
        pushActivity("Agent paused");
      }
    } catch (err: any) {
      const message = err?.message || "Agent error";
      setStatus("Error");
      setError(message);
      pushActivity(`Agent error → ${message}`);
    }
  };

  const manualAction = async (
    action: "getVisualContext" | "webSearch" | "saveMemory" | "readMemory"
  ) => {
    if (action === "webSearch") {
      const query = prompt("Search query?") || "";
      if (!query.trim()) return;
      await toolHandlers.webSearch({ query });
    } else if (action === "saveMemory") {
      const fact = prompt("What should I remember?") || "";
      if (!fact.trim()) return;
      await toolHandlers.saveMemory({ fact });
    } else if (action === "getVisualContext") {
      await toolHandlers.getVisualContext();
    } else {
      await toolHandlers.readMemory();
    }
  };

  const chip = statusStyle[status] || statusStyle.Idle;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <video ref={videoBgRef} className="video-bg" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid-overlay" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Operation: Second Sight</p>
            <h1 className="text-3xl font-semibold text-white drop-shadow">Multimodal HUD for the Blind</h1>
            <p className="text-sm text-slate-300">See, know, and remember—powered by ElevenLabs + Clerk + Anthropic + Tavily.</p>
          </div>
          <div className={classNames("status-chip", chip.chip)}>
            <span className={classNames("status-dot", chip.dot)} />
            <span>{status}</span>
            {agentStatus && <span className="text-xs text-slate-200/80">Agent: {String(agentStatus)}</span>}
          </div>
        </div>

        {!AGENT_ID && (
          <div className="hud-panel p-4 text-sm text-amber-200">
            Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to enable the agent. Manual controls remain active.
          </div>
        )}

        <SignedOut>
          <div className="hud-panel flex flex-col items-start gap-3 p-6 text-slate-100">
            <p className="text-lg font-medium">Sign in to activate Second Sight.</p>
            <p className="text-sm text-slate-300">Camera and HUD stay locked until you authenticate with Clerk.</p>
            <SignInButton>
              <button className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-100 border border-emerald-400/60 shadow-glow hover:bg-emerald-500/30 transition">Sign In</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="hud-grid">
            <div className="hud-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-200">
                  <Radio className="h-4 w-4" />
                  Live Agent Link
                </div>
                <span className="text-xs text-slate-400">Agent ID: {AGENT_ID || "Unset"}</span>
              </div>
              <div className="relative flex items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAgentToggle}
                  className={classNames(
                    "relative h-28 w-28 rounded-full border-2 border-emerald-400/60 bg-emerald-500/10 text-emerald-100 shadow-glow",
                    "flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                  )}
                >
                  <div className="pulse-ring" aria-hidden />
                  {isConnected && isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </motion.button>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{isConnected ? (isRecording ? "Listening" : "Connected") : "Disconnected"}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => connect?.()}
                    className="rounded-full px-3 py-1 border border-white/10 hover:bg-white/5 transition"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => {
                      stopRecording?.();
                      disconnect?.();
                      setStatus("Idle");
                    }}
                    className="rounded-full px-3 py-1 border border-white/10 hover:bg-white/5 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            <div className="hud-panel p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-200">
                <Activity className="h-4 w-4" />
                Manual Tools (always on)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ToolCard
                  label="Visual Context"
                  icon={Camera}
                  status="Looking"
                  busy={busy === "getVisualContext"}
                  onClick={() => manualAction("getVisualContext")}
                />
                <ToolCard
                  label="Web Search"
                  icon={Search}
                  status="Searching"
                  busy={busy === "webSearch"}
                  onClick={() => manualAction("webSearch")}
                />
                <ToolCard
                  label="Save Memory"
                  icon={Save}
                  status="Saving"
                  busy={busy === "saveMemory"}
                  onClick={() => manualAction("saveMemory")}
                />
                <ToolCard
                  label="Read Memory"
                  icon={BookOpen}
                  status="Recalling"
                  busy={busy === "readMemory"}
                  onClick={() => manualAction("readMemory")}
                />
              </div>
            </div>

            <div className="hud-panel p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-200">
                <Link2 className="h-4 w-4" />
                Agent Telemetry
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200 h-48 overflow-y-auto space-y-2">
                {activity.length === 0 && <p className="text-slate-400">No activity yet.</p>}
                {activity.map((item) => (
                  <div key={item.ts} className="flex items-start gap-2">
                    <span className="text-emerald-300">•</span>
                    <div>
                      <p>{item.message}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.ts).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hud-panel p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-200">
                <Camera className="h-4 w-4" />
                Camera Feed
              </div>
              <div className="relative overflow-hidden rounded-xl border border-emerald-400/20 bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" />
                <video
                  ref={videoHudRef}
                  className="relative z-10 h-64 w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}

function ToolCard({
  label,
  icon: Icon,
  status,
  busy,
  onClick,
}: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  status: string;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-glow"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 p-2 shadow-glow">
            <Icon className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-slate-400">{status}</p>
          </div>
        </div>
        {busy && <div className="h-3 w-3 rounded-full bg-emerald-300 animate-pulse" />}
      </div>
    </button>
  );
}
