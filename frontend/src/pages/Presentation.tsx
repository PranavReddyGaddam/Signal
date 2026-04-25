import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SLIDES = [
  "intro",
  "problem",
  "solution",
  "map",
  "cii",
  "esi",
  "council",
  "tech",
  "close",
] as const;

type SlideId = (typeof SLIDES)[number];

function NavDots({ current }: { current: number }) {
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
      {SLIDES.map((_, i) => (
        <button
          key={i}
          onClick={() =>
            document
              .getElementById(`slide-${i}`)
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className={`w-2.5 h-2.5 border-2 border-[#0a0a0a] transition-all ${
            i === current
              ? "bg-[#ffd700] scale-125"
              : "bg-white hover:bg-[#f5f0e8]"
          }`}
        />
      ))}
    </div>
  );
}

function SlideWrapper({
  id,
  index,
  bg = "#f5f0e8",
  children,
}: {
  id: SlideId;
  index: number;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`slide-${index}`}
      data-slide={id}
      className="relative flex flex-col justify-center items-center border-b-[3px] border-[#0a0a0a] overflow-hidden"
      style={{ minHeight: "100vh", background: bg }}
    >
      {children}
    </section>
  );
}

function Tag({ children, color = "#ffd700" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 border-2 border-[#0a0a0a]"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

function NbCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white border-2 border-[#0a0a0a] shadow-[4px_4px_0_#0a0a0a] ${className}`}
    >
      {children}
    </div>
  );
}

// ── Slide 0 — Intro ──────────────────────────────────────────────────────────
function SlideIntro() {
  return (
    <SlideWrapper id="intro" index={0} bg="#0a0a0a">
      <div className="max-w-4xl mx-auto px-8 text-center flex flex-col items-center gap-8">
        <Tag color="#ffd700">Hackathon Demo 2025</Tag>
        <h1
          className="text-[clamp(72px,14vw,160px)] font-black tracking-[0.3em] text-[#ffd700] font-mono leading-none"
          style={{ textShadow: "6px 6px 0 rgba(255,215,0,0.2)" }}
        >
          SIGNAL
        </h1>
        <p className="text-[clamp(16px,2vw,22px)] text-white/80 font-medium max-w-2xl leading-relaxed">
          Real-time geopolitical intelligence + AI agent council for investment decisions.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <span className="live-dot" />
          <span className="text-[#00e676] text-[11px] font-black uppercase tracking-widest">
            Live data · 30-min refresh · Built in 48h
          </span>
        </div>
        <p className="text-white/30 text-sm mt-8 font-mono">scroll to explore ↓</p>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 1 — Problem ────────────────────────────────────────────────────────
function SlideProblem() {
  const costs = [
    { label: "Bloomberg Terminal", price: "$25,000 / yr", color: "#ff1744" },
    { label: "Reuters Eikon", price: "$22,000 / yr", color: "#ff6d00" },
    { label: "FactSet", price: "$12,000 / yr", color: "#ffd700" },
    { label: "Signal", price: "Free + API costs", color: "#00e676" },
  ];

  return (
    <SlideWrapper id="problem" index={1} bg="#f5f0e8">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <div className="mb-10">
          <Tag>The Problem</Tag>
          <h2 className="text-[clamp(36px,6vw,72px)] font-black leading-tight text-[#0a0a0a] mt-4">
            Most investors find out about<br />
            world events from{" "}
            <span
              className="bg-[#ff1744] text-white px-3 py-1 border-2 border-[#0a0a0a] inline-block"
              style={{ transform: "rotate(-1deg)", display: "inline-block" }}
            >
              Twitter.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <NbCard className="p-6">
            <p className="text-[13px] font-black uppercase tracking-wider text-[#0a0a0a]/50 mb-3">
              Information overload
            </p>
            <p className="text-[15px] leading-relaxed text-[#0a0a0a]">
              Thousands of conflict events, sanctions decisions, and economic releases happen
              simultaneously across 190 countries — every single day. No human can synthesize that.
            </p>
          </NbCard>
          <NbCard className="p-6">
            <p className="text-[13px] font-black uppercase tracking-wider text-[#0a0a0a]/50 mb-3">
              Institutional gatekeeping
            </p>
            <p className="text-[15px] leading-relaxed text-[#0a0a0a]">
              The tools that connect geopolitics to markets exist — but they cost more than most
              people make in a year. Built for banks, not for everyone else.
            </p>
          </NbCard>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {costs.map((c) => (
            <NbCard key={c.label} className="p-4 text-center">
              <div
                className="text-[11px] font-black uppercase tracking-wider mb-2 px-2 py-1 border border-[#0a0a0a]"
                style={{ background: c.color }}
              >
                {c.label}
              </div>
              <div className="text-[18px] font-black text-[#0a0a0a]">{c.price}</div>
            </NbCard>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 2 — Solution ───────────────────────────────────────────────────────
function SlideSolution() {
  const pillars = [
    {
      icon: "🌍",
      title: "Live World Map",
      desc: "Conflict, cyber, sanctions, chokepoints, minerals — classified and layered in real time.",
      color: "#2979ff",
    },
    {
      icon: "📊",
      title: "Economic Stress Index",
      desc: "6 FRED series normalized into a single 0-100 composite. VIX, yield curve, HY spreads, CPI.",
      color: "#ffd700",
    },
    {
      icon: "🛡",
      title: "Country Instability Index",
      desc: "28 countries scored across 5 dimensions. Conflict · Unrest · Sanctions · Cyber · Econ Stress.",
      color: "#ff6d00",
    },
    {
      icon: "🤖",
      title: "AI Agent Council",
      desc: "4 specialized agents debate live data and issue per-ticker investment verdicts.",
      color: "#00e676",
    },
  ];

  return (
    <SlideWrapper id="solution" index={2} bg="#ffffff">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag color="#00e676">The Solution</Tag>
        <h2 className="text-[clamp(32px,5vw,60px)] font-black leading-tight text-[#0a0a0a] mt-4 mb-10">
          The intelligence layer that should<br />have existed five years ago.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((p) => (
            <NbCard key={p.title} className="p-6 flex gap-4 items-start">
              <span
                className="text-2xl shrink-0 w-12 h-12 border-2 border-[#0a0a0a] flex items-center justify-center"
                style={{ background: p.color }}
              >
                {p.icon}
              </span>
              <div>
                <p className="font-black text-[15px] text-[#0a0a0a] mb-1">{p.title}</p>
                <p className="text-[13px] text-[#0a0a0a]/70 leading-relaxed">{p.desc}</p>
              </div>
            </NbCard>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 3 — World Map ──────────────────────────────────────────────────────
function SlideMap() {
  const layers = [
    { label: "Conflict Events", color: "#ff1744" },
    { label: "Cyber Incidents", color: "#2979ff" },
    { label: "Active Sanctions", color: "#ff6d00" },
    { label: "Supply Chain Chokepoints", color: "#ffd700" },
    { label: "Critical Minerals", color: "#00e676" },
    { label: "Pipelines", color: "#d500f9" },
    { label: "Submarine Cables", color: "#00e5ff" },
  ];

  return (
    <SlideWrapper id="map" index={3} bg="#0a0a0a">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag color="#2979ff">Live World Map</Tag>
        <h2 className="text-[clamp(28px,4.5vw,56px)] font-black text-white mt-4 mb-3 leading-tight">
          Every geopolitical signal.<br />Classified. Layered. Live.
        </h2>
        <p className="text-white/60 text-[14px] mb-8 max-w-xl">
          Powered by GDELT — the Global Database of Events, Language and Tone.
          English-only filter. Updates every 30 minutes.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          {layers.map((l) => (
            <span
              key={l.label}
              className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-white/20 text-white"
              style={{ background: l.color + "33", borderColor: l.color + "66" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2 border border-white/30"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
        <NbCard className="p-5 bg-[#111]! border-white/10!">
          <div
            className="border-2 border-white/10 p-4 font-mono text-[12px] text-[#00e676] leading-relaxed"
            style={{ background: "#0a0a0a" }}
          >
            <span className="text-white/30">// GDELT API — no auth required</span>
            <br />
            <span className="text-[#ffd700]">GET</span>{" "}
            <span className="text-white">
              https://api.gdeltproject.org/api/v2/events/query
            </span>
            <br />
            <span className="text-white/50">  ?query=</span>
            <span className="text-[#00e676]">conflict+war+sanctions</span>
            <br />
            <span className="text-white/50">  &sourcelang=</span>
            <span className="text-[#00e676]">english</span>
            <span className="text-white/30 ml-3">
              ← mandatory filter (60%+ of results are non-English without it)
            </span>
          </div>
        </NbCard>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 4 — Country Instability Index ──────────────────────────────────────
function SlideCII() {
  const countries = [
    { code: "UA", name: "Ukraine", score: 87, level: "critical", driver: "Conflict" },
    { code: "PS", name: "Palestine", score: 82, level: "critical", driver: "Conflict" },
    { code: "RU", name: "Russia", score: 74, level: "high", driver: "Sanctions" },
    { code: "IR", name: "Iran", score: 68, level: "high", driver: "Sanctions" },
    { code: "TW", name: "Taiwan", score: 55, level: "elevated", driver: "Geopolitical" },
  ];

  const levelColor: Record<string, string> = {
    critical: "#ff1744",
    high: "#ff6d00",
    elevated: "#ffd700",
    normal: "#00e676",
  };

  const dims = ["Conflict", "Unrest", "Sanctions", "Cyber", "Econ"];

  return (
    <SlideWrapper id="cii" index={4} bg="#f5f0e8">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag color="#ff6d00">Country Instability Index</Tag>
        <h2 className="text-[clamp(28px,4.5vw,56px)] font-black text-[#0a0a0a] mt-4 mb-2 leading-tight">
          28 countries. 5 dimensions.<br />Refreshed every 30 minutes.
        </h2>
        <p className="text-[#0a0a0a]/60 text-[14px] mb-8">
          Click any tracked country on the map → the map flies in → a live intelligence brief is generated by Claude.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {countries.map((c) => (
            <NbCard key={c.code} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-[11px] bg-[#0a0a0a] text-white px-2 py-0.5">
                    {c.code}
                  </span>
                  <span className="font-black text-[14px]">{c.name}</span>
                </div>
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 border border-[#0a0a0a]"
                  style={{ background: levelColor[c.level] }}
                >
                  {c.level}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-[#f5f0e8] border border-[#0a0a0a]">
                  <div
                    className="h-full"
                    style={{
                      width: `${c.score}%`,
                      background: levelColor[c.level],
                    }}
                  />
                </div>
                <span className="font-black font-mono text-[13px] w-8 text-right">{c.score}</span>
              </div>
              <p className="text-[11px] text-[#0a0a0a]/50 uppercase tracking-wider font-bold">
                Driver: {c.driver}
              </p>
            </NbCard>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {dims.map((d) => (
            <span
              key={d}
              className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 bg-white border-2 border-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a]"
            >
              {d}
            </span>
          ))}
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 text-[#0a0a0a]/40 self-center">
            → composite 0-100
          </span>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 5 — Economic Stress Index ──────────────────────────────────────────
function SlideESI() {
  const indicators = [
    { id: "VIX", label: "Market Volatility", score: 55, weight: "20%" },
    { id: "T10Y2Y", label: "Yield Curve Spread", score: 82, weight: "25%" },
    { id: "HY Spread", label: "Credit Spread (OAS)", score: 61, weight: "20%" },
    { id: "UNRATE", label: "Unemployment Rate", score: 38, weight: "15%" },
    { id: "CPI MoM", label: "Inflation Pressure", score: 44, weight: "10%" },
    { id: "UMCSENT", label: "Consumer Sentiment", score: 50, weight: "10%" },
  ];

  const composite = Math.round(
    indicators.reduce((acc, i) => acc + i.score * (parseFloat(i.weight) / 100), 0)
  );

  return (
    <SlideWrapper id="esi" index={5} bg="#ffffff">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag color="#ffd700">Economic Stress Index</Tag>
        <h2 className="text-[clamp(28px,4.5vw,56px)] font-black text-[#0a0a0a] mt-4 mb-2 leading-tight">
          6 FRED series.<br />One composite score.
        </h2>
        <p className="text-[#0a0a0a]/60 text-[14px] mb-8">
          Normalized 0-100. Higher = more stress. Updated every 30 minutes.
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <NbCard className="p-6 flex flex-col items-center justify-center min-w-[160px]">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#0a0a0a]/50 mb-2">
              Composite
            </p>
            <span
              className="text-[72px] font-black font-mono leading-none"
              style={{ color: composite > 60 ? "#ff6d00" : composite > 40 ? "#ffd700" : "#00e676" }}
            >
              {composite}
            </span>
            <span
              className="text-[11px] font-black uppercase tracking-wider mt-2 px-3 py-1 border-2 border-[#0a0a0a]"
              style={{
                background: composite > 60 ? "#ff6d00" : composite > 40 ? "#ffd700" : "#00e676",
              }}
            >
              {composite > 60 ? "Elevated" : composite > 40 ? "Moderate" : "Normal"}
            </span>
          </NbCard>
          <div className="flex-1 flex flex-col gap-2">
            {indicators.map((ind) => (
              <div key={ind.id} className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-black w-20 shrink-0 text-[#0a0a0a]/50">
                  {ind.id}
                </span>
                <div className="flex-1 h-5 bg-[#f5f0e8] border border-[#0a0a0a] relative">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${ind.score}%`,
                      background:
                        ind.score > 65 ? "#ff1744" : ind.score > 45 ? "#ff6d00" : "#00e676",
                    }}
                  />
                  <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-black text-[#0a0a0a]">
                    {ind.label}
                  </span>
                </div>
                <span className="font-mono font-black text-[12px] w-8 text-right">{ind.score}</span>
                <span className="text-[10px] text-[#0a0a0a]/40 w-8 text-right">{ind.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 6 — AI Agent Council ───────────────────────────────────────────────
function SlideCouncil() {
  const agents = [
    {
      name: "Macro Agent",
      model: "Haiku",
      input: "ESI composite + classified macro news",
      output: "Regime · Risk score · Rate outlook",
      color: "#ffd700",
    },
    {
      name: "Geo-Risk Agent",
      model: "Haiku",
      input: "CII per country · Chokepoint flags · Geo headlines",
      output: "Per-ticker geo flags · Supply chain risk",
      color: "#ff6d00",
    },
    {
      name: "Market Agent",
      model: "Haiku",
      input: "Quant scores (pre-computed) · Ticker news",
      output: "Signal · Confidence · Price targets",
      color: "#2979ff",
    },
    {
      name: "Devil's Advocate",
      model: "Haiku",
      input: "All 3 agent reports",
      output: "Bear cases · Tail risks",
      color: "#ff1744",
    },
  ];

  return (
    <SlideWrapper id="council" index={6} bg="#0a0a0a">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag color="#00e676">AI Agent Council</Tag>
        <h2 className="text-[clamp(28px,4.5vw,56px)] font-black text-white mt-4 mb-3 leading-tight">
          Four agents debate live data.<br />One verdict per position.
        </h2>
        <p className="text-white/50 text-[13px] mb-8 max-w-xl">
          Core design principle: <span className="text-[#ffd700] font-bold">LLMs receive pre-scored, structured facts — never raw data.</span>{" "}
          This keeps outputs reliable and parseable as JSON.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {agents.map((a, i) => (
            <div
              key={a.name}
              className="border-2 border-white/10 p-4"
              style={{ background: a.color + "15" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 border border-[#0a0a0a]"
                  style={{ background: a.color }}
                >
                  {i === 3 ? "Sequential" : "Parallel"}
                </span>
                <span className="font-black text-white text-[14px]">{a.name}</span>
                <span className="text-white/30 text-[11px] ml-auto font-mono">Claude {a.model}</span>
              </div>
              <p className="text-[12px] text-white/50 mb-1">
                <span className="text-white/30">Input: </span>{a.input}
              </p>
              <p className="text-[12px] text-white/50">
                <span className="text-white/30">Output: </span>{a.output}
              </p>
            </div>
          ))}
        </div>
        <div
          className="border-2 border-[#00e676]/30 p-4"
          style={{ background: "#00e67610" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#00e676] border border-[#0a0a0a]">
              Orchestrator
            </span>
            <span className="font-black text-white text-[14px]">Claude Sonnet</span>
            <span className="text-white/30 text-[11px] ml-auto font-mono">~35-45s total</span>
          </div>
          <p className="text-[12px] text-white/60">
            Synthesizes all 4 reports → final verdict:{" "}
            <span className="font-black text-[#00e676]">
              HOLD · ADD · REDUCE · EXIT
            </span>{" "}
            per ticker with conviction score + reasoning.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 7 — Tech Stack ─────────────────────────────────────────────────────
function SlideTech() {
  const stack = [
    {
      layer: "Frontend",
      items: ["React 18 + TypeScript", "Vite + TailwindCSS v4", "Leaflet · Recharts · Globe.gl"],
      color: "#2979ff",
    },
    {
      layer: "Backend",
      items: ["Python 3.11 + FastAPI", "APScheduler (async, 15-min)", "asyncio + httpx"],
      color: "#ffd700",
    },
    {
      layer: "Database",
      items: ["Supabase (PostgreSQL)", "pgvector + vecs", "VoyageAI embeddings"],
      color: "#d500f9",
    },
    {
      layer: "AI / Data",
      items: ["Claude Haiku + Sonnet", "GDELT · FRED · ACLED", "NewsAPI · yfinance"],
      color: "#00e676",
    },
  ];

  return (
    <SlideWrapper id="tech" index={7} bg="#f5f0e8">
      <div className="max-w-5xl mx-auto px-8 w-full">
        <Tag>Technical Architecture</Tag>
        <h2 className="text-[clamp(28px,4.5vw,56px)] font-black text-[#0a0a0a] mt-4 mb-8 leading-tight">
          Built for real-time.<br />Designed for reliability.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stack.map((s) => (
            <NbCard key={s.layer} className="p-4">
              <div
                className="text-[10px] font-black uppercase tracking-wider px-2 py-1 border border-[#0a0a0a] mb-3 text-center"
                style={{ background: s.color }}
              >
                {s.layer}
              </div>
              {s.items.map((item) => (
                <p key={item} className="text-[12px] text-[#0a0a0a]/70 py-1 border-b border-[#0a0a0a]/10 last:border-0">
                  {item}
                </p>
              ))}
            </NbCard>
          ))}
        </div>
        <NbCard className="p-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#0a0a0a]/40 mb-3">
            Ingestion pipeline
          </p>
          <div className="flex items-center gap-2 flex-wrap text-[12px] font-mono">
            {["FRED", "NewsAPI", "yfinance", "GDELT", "ACLED"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="bg-[#0a0a0a] text-white px-2 py-0.5 font-black">{s}</span>
                {i < arr.length - 1 && <span className="text-[#0a0a0a]/30">→</span>}
              </span>
            ))}
            <span className="text-[#0a0a0a]/30">→</span>
            <span className="bg-[#ffd700] border border-[#0a0a0a] px-2 py-0.5 font-black">
              news_classifier.py
            </span>
            <span className="text-[#0a0a0a]/30">→</span>
            <span className="bg-[#00e676] border border-[#0a0a0a] px-2 py-0.5 font-black">
              Supabase
            </span>
            <span className="text-[#0a0a0a]/30">→</span>
            <span className="bg-[#2979ff] text-white border border-[#0a0a0a] px-2 py-0.5 font-black">
              Agents
            </span>
          </div>
        </NbCard>
      </div>
    </SlideWrapper>
  );
}

// ── Slide 8 — Close ──────────────────────────────────────────────────────────
function SlideClose() {
  const navigate = useNavigate();

  return (
    <SlideWrapper id="close" index={8} bg="#ffd700">
      <div className="max-w-4xl mx-auto px-8 text-center flex flex-col items-center gap-8">
        <div
          className="text-[clamp(48px,10vw,120px)] font-black tracking-[0.3em] text-[#0a0a0a] font-mono leading-none"
        >
          SIGNAL
        </div>
        <p className="text-[clamp(18px,2.5vw,28px)] font-black text-[#0a0a0a] max-w-2xl leading-tight">
          The world doesn't move in quarters.<br />
          Your portfolio shouldn't find out from Twitter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-[12px] font-black uppercase tracking-wider px-8 py-3
            bg-[#0a0a0a] text-[#ffd700] border-2 border-[#0a0a0a]
            shadow-[4px_4px_0_#0a0a0a] hover:shadow-none hover:translate-x-1 hover:translate-y-1
            transition-all cursor-pointer"
          >
            Open Live Dashboard →
          </button>
          <a
            href="https://github.com/PranavReddyGaddam/Signal"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-black uppercase tracking-wider px-8 py-3
            bg-white text-[#0a0a0a] border-2 border-[#0a0a0a]
            shadow-[4px_4px_0_#0a0a0a] hover:shadow-none hover:translate-x-1 hover:translate-y-1
            transition-all"
          >
            GitHub
          </a>
        </div>
        <p className="text-[#0a0a0a]/50 text-[12px] font-mono mt-4">
          Built by Pranav Reddy Gaddam · SJSU · 2025
        </p>
      </div>
    </SlideWrapper>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const index = parseInt(e.target.id.replace("slide-", ""));
            if (!isNaN(index)) setCurrentSlide(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    SLIDES.forEach((_, i) => {
      const el = document.getElementById(`slide-${i}`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div
      className="relative"
      style={{ scrollSnapType: "y mandatory", overflowY: "scroll", height: "100vh" }}
    >
      <NavDots current={currentSlide} />

      <div style={{ scrollSnapAlign: "start" }}><SlideIntro /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideProblem /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideSolution /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideMap /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideCII /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideESI /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideCouncil /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideTech /></div>
      <div style={{ scrollSnapAlign: "start" }}><SlideClose /></div>
    </div>
  );
}
