import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Sight",
  description: "A multimodal reality OS that sees, knows, and remembers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-950 text-slate-50">
          <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/70 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-glow" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Second Sight</p>
                <p className="text-sm text-slate-300">Missing Clerk publishable key</p>
              </div>
            </div>
          </header>
          <main className="pt-20">
            <div className="mx-auto max-w-2xl p-6 hud-panel text-amber-200">
              Provide NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable auth.
            </div>
          </main>
        </body>
      </html>
    );
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="min-h-screen bg-slate-950 text-slate-50">
          <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/70 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-glow" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Second Sight</p>
                <p className="text-sm text-slate-300">Reality OS for the blind</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SignedOut>
                <div className="flex items-center gap-2 text-sm">
                  <SignInButton>
                    <button className="px-3 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition">Sign In</button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="px-3 py-2 rounded-full border border-emerald-400/60 text-emerald-200 shadow-glow hover:bg-emerald-500/10 transition">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
                  <span className="text-xs uppercase tracking-[0.2em] text-emerald-200">Authorized</span>
                </div>
              </SignedIn>
            </div>
          </header>
          <main className="pt-20">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
