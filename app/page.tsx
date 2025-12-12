"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import classNames from "classnames";
import { useConversation } from "@11labs/react";
import {
  Activity,
  BookOpen,
  Camera,
  Cpu,
  Globe,
  Mic,
  Radio,
  Save,
  Square,
  Zap,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { ToolCard } from "../components/ToolCard";

const statusStyle: Record<string, { dot: string; chip: string; label: string }> = {
  Idle: { dot: "bg-emerald-400", chip: "status-idle", label: "System Ready" },
  Listening: { dot: "bg-cyan-400", chip: "status-listening", label: "Listening..." },
  Thinking: { dot: "bg-purple-400", chip: "status-thinking", label: "Processing..." },
  Looking: { dot: "bg-lime-400", chip: "status-looking", label: "Visual Analysis" },
  Searching: { dot: "bg-sky-400", chip: "status-searching", label: "Web Search" },
  Saving: { dot: "bg-emerald-400", chip: "status-saving", label: "Saving Memory" },
  Recalling: { dot: "bg-indigo-400", chip: "status-recalling", label: "Recalling" },
  Error: { dot: "bg-rose-500", chip: "status-error", label: "System Error" },
};

type StatusKey = keyof typeof statusStyle;

type ActivityItem = {
  ts: number;
  message: string;
  type?: "info" | "error" | "success";
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

  const pushActivity = useCallback((message: string, type: "info" | "error" | "success" = "info") => {
    setActivity((prev) => [{ ts: Date.now(), message, type }, ...prev].slice(0, 15));
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
          pushActivity(`Observation: ${text}`, "success");
          setStatus("Idle");
          return text;
        } catch (err: any) {
          const message = err?.message || "Vision failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Vision error: ${message}`, "error");
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
          pushActivity(`Found info on: "${query}"`, "success");
          setStatus("Idle");
          return summary;
        } catch (err: any) {
          const message = err?.message || "Search failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Search error: ${message}`, "error");
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
          pushActivity(`Memorized: "${fact}"`, "success");
          setStatus("Idle");
          return message;
        } catch (err: any) {
          const message = err?.message || "Save failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Memory error: ${message}`, "error");
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
          pushActivity(`Recalled ${memories.length} facts`, "success");
          setStatus("Idle");
          return text;
        } catch (err: any) {
          const message = err?.message || "Recall failed";
          setStatus("Error");
          setError(message);
          pushActivity(`Recall error: ${message}`, "error");
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
    onMessage: (message: any) => {
      if (message.source === "ai") {
        // Optional: capture AI speech if needed
      }
    },
    onError: (err: any) => {
      console.error(err);
      pushActivity(`Connection error: ${err.message}`, "error");
    }
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
        pushActivity("Secure link established", "success");
      } else if (!isRecording) {
        setStatus("Listening");
        await startRecording?.();
        pushActivity("Resuming audio uplink", "info");
      } else {
        setStatus("Idle");
        await stopRecording?.();
        pushActivity("Pausing audio uplink", "info");
      }
    } catch (err: any) {
      const message = err?.message || "Agent error";
      setStatus("Error");
      setError(message);
      pushActivity(`Connection failed: ${message}`, "error");
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
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden font-sans">
      <video ref={videoBgRef} className="video-bg" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid-overlay" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-8">

        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-sm tracking-tight">
              Multimodal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Reality OS</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Advanced neural interface processing visual and auditory inputs in real-time.
              Powered by ElevenLabs, Anthropic & Clerk.
            </p>
          </motion.div>

          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={classNames(
              "status-chip px-3 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase flex items-center gap-2 transition-all duration-300 backdrop-blur-xl",
              chip.chip
            )}
          >
            <span className={classNames("status-dot w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300", chip.dot, "animate-pulse")} />
            <span className="mr-2">{chip.label}</span>
            {agentStatus && <span className="border-l border-white/10 pl-3 text-xs text-slate-300/80 font-mono">{String(agentStatus)}</span>}
          </motion.div>
        </div>

        {!AGENT_ID && (
          <div className="hud-panel p-4 text-sm text-amber-200 border-l-4 border-amber-500 bg-amber-950/20">
            <span className="font-bold mr-2">CONFIGURATION WARNING:</span>
            Set <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> to enable the conversation engine.
          </div>
        )}

        {/* Not Signed In State */}
        <SignedOut>
          <div className="flex h-[50vh] items-center justify-center">
            <div className="hud-panel flex max-w-md flex-col items-center gap-6 p-10 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-900/50 flex items-center justify-center border border-emerald-500/20 shadow-glow">
                <Zap className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white">Authentication Required</p>
                <p className="text-sm text-slate-400">Initialize generic biometric sequence to access the neural interface.</p>
              </div>
              <SignInButton>
                <button className="group relative px-8 py-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Initialize Session
                    <Radio className="h-4 w-4" />
                  </span>
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        {/* Signed In Dashboard */}
        <SignedIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Agent Control & Feed */}
            <div className="lg:col-span-4 space-y-6">

              {/* Feed Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hud-panel p-1 overflow-hidden group"
              >
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md border border-emerald-500/20">
                    <Camera className="h-3 w-3" />
                    Live Feed
                  </div>
                  <video
                    ref={videoHudRef}
                    className="h-64 w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                    muted
                    playsInline
                    autoPlay
                  />
                  <div className="absolute inset-0 border-[3px] border-emerald-500/10 rounded-xl pointer-events-none" />
                </div>
              </motion.div>

              {/* Agent Control */}
              <div className="hud-panel p-6 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/10 pointer-events-none" />

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-white">Neural Uplink</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    {isConnected ? (isRecording ? "Transmitting Audio" : "Voice Link Active") : "Ready to Connect"}
                  </p>
                </div>

                <button
                  onClick={handleAgentToggle}
                  className={classNames(
                    "relative flex items-center justify-center h-24 w-24 rounded-full transition-all duration-500",
                    isConnected && isRecording
                      ? "bg-red-500/10 border-2 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse"
                      : "bg-emerald-500/10 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.2)] hover:shadow-[0_0_50px_rgba(52,211,153,0.4)] hover:bg-emerald-500/20"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isConnected && isRecording ? (
                      <motion.div
                        key="stop"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Square className="h-8 w-8 fill-current" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="start"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Mic className="h-8 w-8" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={() => connect?.()}
                    disabled={isConnected}
                    className="text-xs text-slate-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium uppercase tracking-wide"
                  >
                    Initialize
                  </button>
                  <button
                    onClick={() => disconnect?.()}
                    disabled={!isConnected}
                    className="text-xs text-slate-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium uppercase tracking-wide"
                  >
                    Terminate
                  </button>
                </div>
              </div>

            </div>

            {/* Middle Column: Manual Tools */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">Manual Overrides</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToolCard
                  label="Visual Audit"
                  description="Analyze current frame"
                  icon={Camera}
                  status="Vision"
                  busy={busy === "getVisualContext"}
                  onClick={() => manualAction("getVisualContext")}
                  gradient="from-purple-500/10 via-transparent to-blue-500/10"
                />
                <ToolCard
                  label="Global Query"
                  description="Access web data"
                  icon={Globe}
                  status="Network"
                  busy={busy === "webSearch"}
                  onClick={() => manualAction("webSearch")}
                  gradient="from-cyan-500/10 via-transparent to-sky-500/10"
                />
                <ToolCard
                  label="Engram Write"
                  description="Store detailed fact"
                  icon={Save}
                  status="Memory"
                  busy={busy === "saveMemory"}
                  onClick={() => manualAction("saveMemory")}
                  gradient="from-emerald-500/10 via-transparent to-lime-500/10"
                />
                <ToolCard
                  label="Engram Read"
                  description="Recall saved data"
                  icon={BookOpen}
                  status="Recall"
                  busy={busy === "readMemory"}
                  onClick={() => manualAction("readMemory")}
                  gradient="from-amber-500/10 via-transparent to-orange-500/10"
                />
              </div>
            </div>

            {/* Right Column: Telemetry */}
            <div className="lg:col-span-3">
              <div className="hud-panel h-full min-h-[400px] flex flex-col p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">Telemetry</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {activity.map((item) => (
                      <motion.div
                        key={item.ts}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={classNames(
                          "p-3 rounded-lg border text-xs leading-relaxed",
                          item.type === 'error' ? "bg-rose-950/30 border-rose-500/30 text-rose-200" :
                            item.type === 'success' ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200" :
                              "bg-slate-900/50 border-white/5 text-slate-300"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1 opacity-60">
                          <span className="text-[10px] font-mono">{new Date(item.ts).toLocaleTimeString()}</span>
                        </div>
                        <p>{item.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {activity.length === 0 && (
                    <div className="text-center text-slate-500 py-10 text-xs">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      Awaiting system events...
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </SignedIn>

      </div>
    </div>
  );
}
