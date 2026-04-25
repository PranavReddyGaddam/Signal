import { useState, useEffect, useCallback } from "react";
import WorldMap from "./components/WorldMap";
import SignalFeed from "./components/SignalFeed";
import ImplicationsPanel from "./components/ImplicationsPanel";
import MacroStress from "./components/MacroStress";
import EconStressIndex from "./components/EconStressIndex";
import AIBrief from "./components/AIBrief";
import LiveNewsFeed from "./components/LiveNewsFeed";
import type { NewsPlayerState } from "./components/LiveNewsFeed";
import FullscreenPanel from "./components/FullscreenPanel";
import RiskScores from "./components/RiskScores";
import PortfolioModal from "./components/PortfolioModal";
import CouncilModal from "./components/CouncilModal";
import type { Signal } from "./types";
import { useBackendStatus } from "./api/useBackendStatus";
import { fetchAIToggle, setAIToggle } from "./api/client";

type FullscreenTarget =
  | "map"
  | "feed"
  | "news"
  | "brief"
  | "macro"
  | "implications"
  | "risk"
  | null;

function FullscreenButton({ onClick, size = "sm" }: { onClick: () => void; size?: "sm" | "lg" }) {
  return (
    <button
      onClick={onClick}
      title="Fullscreen"
      className={`font-black border-2 border-[#0a0a0a] bg-white hover:bg-[#f5f0e8] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all leading-none
        ${size === "lg" ? "text-[16px] px-2.5 py-1.5" : "text-[9px] px-1.5 py-0.5"}`}
    >
      ⛶
    </button>
  );
}

export default function App() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const backendStatus = useBackendStatus();
  const [fullscreen, setFullscreen] = useState<FullscreenTarget>(null);
  const [newsPlayerState, setNewsPlayerState] = useState<NewsPlayerState>({
    currentId: "bloomberg",
  });
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    fetchAIToggle()
      .then(setAiEnabled)
      .catch(() => {});
  }, []);

  const toggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    setAIToggle(next).catch(() => setAiEnabled(!next));
  };

  const fs = (target: FullscreenTarget) => () => setFullscreen(target);
  const closeFs = () => setFullscreen(null);

  return (
    <div className="flex flex-col" style={{ background: "#f5f0e8" }}>
      <div
        className="grid"
        style={{
          height: "100vh",
          gridTemplateAreas:
            '"topbar topbar  topbar"' +
            '"map    map     map   "' +
            '"feed   news    right "',
          gridTemplateColumns: "300px 1fr 280px",
          gridTemplateRows: "52px 45vh 1fr",
          background: "#f5f0e8",
        }}
      >
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <header
          className="flex items-center gap-3 px-5 border-b-[3px] border-[#0a0a0a] bg-[#ffd700]"
          style={{ gridArea: "topbar" }}
        >
          <span className="text-xl font-black tracking-[0.35em] text-[#0a0a0a] font-mono">
            SIGNAL
          </span>
          <span
            className="live-dot"
            style={{
              background:
                backendStatus === "online"
                  ? "#00e676"
                  : backendStatus === "offline"
                    ? "#ff1744"
                    : "#ffd700",
              animation: backendStatus === "online" ? undefined : "none",
            }}
          />
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${
              backendStatus === "online"
                ? "text-[#0a0a0a]"
                : backendStatus === "offline"
                  ? "text-[#ff1744]"
                  : "text-[#0a0a0a]/50"
            }`}
          >
            {backendStatus === "online"
              ? "Live"
              : backendStatus === "offline"
                ? "Offline"
                : "Connecting..."}
          </span>
          
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={triggerRefresh}
              title="Refresh all data"
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1
              bg-white text-[#0a0a0a] border-2 border-[#0a0a0a]
              shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
              transition-all cursor-pointer"
            >
              <span
                className="inline-block"
                style={
                  refreshing ? { animation: "spin 0.6s linear infinite" } : {}
                }
              >
                ↻
              </span>
            </button>
            <button
              onClick={toggleAI}
              title={
                aiEnabled
                  ? "Disable AI analysis to save credits"
                  : "Enable AI analysis"
              }
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-3 py-1
              border-2 border-[#0a0a0a] transition-all
              shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              style={{
                background: aiEnabled ? "#00e676" : "#f5f0e8",
                color: "#0a0a0a",
              }}
            >
              <span
                className="w-2 h-2 rounded-full border border-[#0a0a0a]/30 shrink-0"
                style={{ background: aiEnabled ? "#0a0a0a" : "#0a0a0a40" }}
              />
              {aiEnabled ? "AI On" : "AI Off"}
            </button>
            <button
              onClick={() => setPortfolioOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1
              bg-white text-[#0a0a0a] border-2 border-[#0a0a0a]
              shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
              transition-all cursor-pointer"
            >
              Portfolio
            </button>
            <button
              onClick={() => setCouncilOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1
              bg-[#0a0a0a] text-[#ffd700] border-2 border-[#0a0a0a]
              shadow-[2px_2px_0_#00000040] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
              transition-all cursor-pointer"
            >
              Run Council
            </button>
          </div>
        </header>

        {/* ── World Map — full width ───────────────────────────────────────── */}
        <section
          className="overflow-hidden border-b-[3px] border-[#0a0a0a] bg-[#0a0a0a] relative"
          style={{ gridArea: "map" }}
        >
          <WorldMap key={refreshKey} onFullscreen={fs("map")} />
        </section>

        {/* ── Signal Feed ─────────────────────────────────────────────────── */}
        <section
          className="flex flex-col overflow-hidden border-r-[3px] border-[#0a0a0a] bg-[#f5f0e8]"
          style={{ gridArea: "feed" }}
        >
          <div className="px-4 py-2.5 border-b-[3px] border-[#0a0a0a] bg-white flex items-center justify-between shrink-0">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
              Signal Feed
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase bg-[#0a0a0a] text-white px-2 py-0.5">
                Live
              </span>
              <FullscreenButton onClick={fs("feed")} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <SignalFeed
              key={refreshKey}
              onSelect={setSelectedSignal}
              selectedId={selectedSignal?.id ?? null}
            />
          </div>
        </section>

        {/* ── Live News Feed ──────────────────────────────────────────────── */}
        <section
          className="flex flex-col overflow-hidden border-r-[3px] border-[#0a0a0a] bg-[#0a0a0a]"
          style={{ gridArea: "news" }}
        >
          <LiveNewsFeed
            onFullscreen={fs("news")}
            onStateChange={setNewsPlayerState}
          />
        </section>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col overflow-hidden border-l-[3px] border-[#0a0a0a] bg-[#f5f0e8]"
          style={{ gridArea: "right" }}
        >
          <div className="overflow-y-auto h-full">
            <div className="relative">
              <div className="absolute top-2.5 right-3 z-10">
                <FullscreenButton onClick={fs("macro")} />
              </div>
              <MacroStress key={refreshKey} />
            </div>
            <EconStressIndex refreshKey={refreshKey} />
          </div>
        </aside>
      </div>

      {/* ── Below the fold: AI Brief + Ticker Implications ─────────────── */}
      <div
        className="grid border-t-[3px] border-[#0a0a0a] transition-all duration-300"
        style={{ gridTemplateColumns: selectedSignal ? "1fr 380px" : "1fr" }}
      >
        <section className="border-r-[3px] border-[#0a0a0a] bg-white relative">
          <div className="absolute top-2.5 right-3 z-10">
            <FullscreenButton onClick={fs("brief")} />
          </div>
          <AIBrief key={refreshKey} />
        </section>
        {selectedSignal && (
          <section className="bg-[#f5f0e8] relative border-l-[3px] border-[#0a0a0a]">
            <div className="absolute top-2.5 right-3 z-10">
              <FullscreenButton onClick={fs("implications")} />
            </div>
            <ImplicationsPanel signal={selectedSignal} />
          </section>
        )}
      </div>

      {/* ── Country Instability Index ────────────────────────────────────── */}
      <section className="border-t-[3px] border-[#0a0a0a] bg-[#f5f0e8] relative">
        <div className="absolute top-2.5 right-3 z-10">
          <FullscreenButton onClick={fs("risk")} />
        </div>
        <RiskScores key={refreshKey} />
      </section>

      {/* ── Fullscreen overlays ─────────────────────────────────────────── */}
      {fullscreen === "map" && (
        <FullscreenPanel title="World Map" onClose={closeFs}>
          <WorldMap />
        </FullscreenPanel>
      )}
      {fullscreen === "feed" && (
        <FullscreenPanel title="Signal Feed" onClose={closeFs}>
          <SignalFeed
            onSelect={(sig) => {
              setSelectedSignal(sig);
              closeFs();
            }}
            selectedId={selectedSignal?.id ?? null}
          />
        </FullscreenPanel>
      )}
      {fullscreen === "news" && (
        <FullscreenPanel title="Live News" onClose={closeFs}>
          <LiveNewsFeed
            onFullscreen={closeFs}
            externalState={newsPlayerState}
            onStateChange={setNewsPlayerState}
          />
        </FullscreenPanel>
      )}
      {fullscreen === "brief" && (
        <FullscreenPanel title="AI Brief" onClose={closeFs}>
          <AIBrief />
        </FullscreenPanel>
      )}
      {fullscreen === "macro" && (
        <FullscreenPanel title="Macro Stress Indicators" onClose={closeFs}>
          <MacroStress />
        </FullscreenPanel>
      )}
      {fullscreen === "implications" && (
        <FullscreenPanel title="Ticker Implications" onClose={closeFs}>
          <ImplicationsPanel signal={selectedSignal} />
        </FullscreenPanel>
      )}
      {fullscreen === "risk" && (
        <FullscreenPanel title="Country Instability Index" onClose={closeFs}>
          <RiskScores />
        </FullscreenPanel>
      )}

      {portfolioOpen && (
        <PortfolioModal onClose={() => setPortfolioOpen(false)} />
      )}
      {councilOpen && <CouncilModal onClose={() => setCouncilOpen(false)} />}
    </div>
  );
}
