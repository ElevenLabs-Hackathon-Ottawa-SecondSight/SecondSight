import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Sight",
  description: "A multimodal reality OS that sees, knows, and remembers.",
};

import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body className={`${outfit.className} min-h-screen bg-slate-950 text-slate-50 overflow-hidden`}>
          <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-glow animate-pulseSlow" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300 font-bold">Second Sight</p>
                <p className="text-sm text-slate-400">System Integrity Warning</p>
              </div>
            </div>
          </header>
          <main className="pt-24 flex items-center justify-center h-screen">
            <div className="mx-auto max-w-lg p-8 hud-panel text-amber-200 text-center border-amber-500/20 bg-amber-950/10">
              <p className="font-semibold text-lg mb-2">Configuration Error</p>
              Provide <code className="bg-black/30 px-2 py-1 rounded text-amber-100">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to enable auth.
            </div>
          </main>
        </body>
      </html>
    );
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={`${outfit.className} min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-100`}>
          <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/5 transition-all duration-500 hover:bg-slate-950/80">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="h-10 w-10 relative rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-glow group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/80 font-bold group-hover:text-emerald-300 transition-colors">Project Actions</p>
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Second Sight</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SignedOut>
                <div className="flex items-center gap-3 text-sm">
                  <SignInButton>
                    <button className="px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-slate-300 hover:text-white font-medium backdrop-blur-md">Sign In</button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all font-medium">
                      Initialize
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 font-semibold">Operator</span>
                    <span className="text-xs text-slate-400">Online</span>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all shadow-lg"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </header>
          <main className="pt-24 min-h-screen relative">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950/0 to-slate-950/0 z-[-1]" />
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
